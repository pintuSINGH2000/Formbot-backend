const Folder = require("../models/folder");
const Form = require("../models/form");
const FormData = require("../models/formdata");
const User = require("../models/user");
const mongoose = require("mongoose");

const createFolder = async (req, res) => {
  try {
    const creator = req.creator;
    const folderData = req.body;
    if (!folderData || !folderData.name || folderData.name.trim().length == 0) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }
    const folder = new Folder({ name: folderData.name, creator: creator });
    await folder.save();

    await User.findByIdAndUpdate(creator, { $push: { folders: folder._id } });
    res.status(201).send({ folder, message: "Folder Created Successfully" });
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

const getAllFolder = async (req, res) => {
  try {
    const creator = req.creator;
    const folders = await User.findById(creator)
      .populate({
        path: "folders",
        select: "name",
      })
      .exec();
    const forms = await Folder.findById(folders.general)
      .populate({
        path: "forms",
        select: "name",
      })
      .exec();

    return res
      .status(201)
      .send({ folders: folders.folders, forms: forms.forms });
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const creator = req.creator;
    const folderId = req.params.folderId;
    if (!folderId) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }
    const user = await User.findByIdAndUpdate(
      creator,
      { $pull: { folders: folderId } },
      { new: true }
    );

    if (!user) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }

    // Find the folder to delete
    const folder = await Folder.findById(folderId);

    if (!folder) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }

    // Optionally, delete all forms associated with the folder
    await Form.deleteMany({ _id: { $in: folder.forms } });
    // Delete the folder
    await Folder.findByIdAndDelete(folderId);
    return res.status(201).send({
      deleted: true,
      message: "Folder and associated forms deleted successfully",
    });
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

const deleteForm = async (req, res) => {
  try {
    const creator = req.creator;
    const formId = req.params.formId;

    if (!formId) {
      return res.status(400).send({ errorMessage: "Form ID is required" });
    }

    // Find the form to delete
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).send({ errorMessage: "Form not found" });
    }

    if (form.creator.toString() !== creator.toString()) {
      return res
        .status(403)
        .send({ errorMessage: "Unauthorized to delete this form" });
    }

    // Remove form reference from the folder
    await Folder.findByIdAndUpdate(
      form.folder,
      { $pull: { forms: formId } },
      { new: true }
    );

    // Delete all FormData associated with the form
    await FormData.deleteMany({ form: formId });

    // Delete the form
    await Form.findByIdAndDelete(formId);

    return res.status(200).send({
      deleted: true,
      message: "Form deleted successfully",
    });
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

const createForm = async (req, res) => {
  try {
    const creator = req.creator;
    const formData = req.body;
    if (!formData.folder) {
      const user = await User.findById(creator).select("general").lean();
      formData.folder = user.general;
    }
    const folder = await Folder.findById(formData.folder);
    if (!folder) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }
    formData.fields = formData.fields.map((field) => {
      if (!field._id) {
        field._id = new mongoose.Types.ObjectId();
      }
      return field;
    });

    const inputFields = formData.fields.filter((field) => !field.isBubble);

    const form = new Form({
      name: formData.formName,
      fields: formData.fields,
      creator: creator,
      theme: formData.theme,
      folder: formData.folder,
      firstInput: inputFields.length > 0 ? inputFields[0]._id : null,
      lastInput:
        inputFields.length > 0 ? inputFields[inputFields.length - 1]._id : null,
    });

    await form.save();
    folder.forms.push(form._id);
    await folder.save();

    res
      .status(201)
      .send({ form: form._id, message: "Form Created Successfully" });
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

const updateForm = async (req, res) => {
  try {
    const creator = req.creator;
    const formId = req.params.formId;
    const formData = req.body;
    if (!formId) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }

    if (!formData.folder) {
      const user = await User.findById(creator).select("general").lean();
      formData.folder = user.general;
    }

    // Validate the new folder
    const folder = await Folder.findById(formData.folder);

    if (!folder || !folder.forms.includes(formId)) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }

    if (folder.creator.toString() !== creator.toString()) {
      return res
        .status(403)
        .send({ errorMessage: "Unauthorized to update this form" });
    }

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }

    // Map existing field IDs
    const existingFieldIds = form.fields.map((field) => field._id.toString());

    // Filter updated field IDs, excluding new fields without _id
    const updatedFieldIds = formData.fields
      .map((field) => field._id)
      .filter((id) => id);

    // Identify removed field IDs
    const removedFieldIds = existingFieldIds.filter(
      (id) => !updatedFieldIds.includes(id)
    );

    // Remove data corresponding to the removed fields in FormData

    if (removedFieldIds.length > 0) {
      const unsetObject = removedFieldIds.reduce((acc, fieldId) => {
        acc[`data.${fieldId}`] = "";
        return acc;
      }, {});

      await FormData.updateMany({ form: formId }, { $unset: unsetObject });
    }

    formData.fields = formData.fields.map((field) => {
      if (!field._id) {
        field._id = new mongoose.Types.ObjectId();
      }
      return field;
    });

    const inputFields = formData.fields.filter((field) => !field.isBubble);

    form.name = formData.formName;
    form.theme = formData.theme;
    form.fields = formData.fields;
    form.firstInput = inputFields.length > 0 ? inputFields[0]._id : null;
    form.lastInput =
      inputFields.length > 0 ? inputFields[inputFields.length - 1]._id : null;
    await form.save();

    res
      .status(200)
      .send({ form: form._id, message: "Form Updated Successfully" });
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

const getForm = async (req, res) => {
  try {
    const formId = req.params.formId;
    const form = await Form.findById(formId);
    return res.status(201).send({ form: form });
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

const getAllForm = async (req, res) => {
  try {
    const creator = req.creator;
    const folderId = req.params.folderId;

    if (!folderId) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }
    const forms = await Folder.findById(folderId)
      .populate({
        path: "forms",
        select: "name",
      })
      .exec();

    return res.status(201).send({ forms: forms });
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

const getUserForm = async (req, res) => {
  try {
    const formId = req.params.formId;
    if (!formId) {
      return res.status(404).send({ errorMessage: "Something went Wrong" });
    }
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).send({ errorMessage: "Something went Wrong" });
    }
    form.views++;
    await form.save();
    return res.status(201).send({ form: form.fields, theme: form.theme });
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

const addFormData = async (req, res) => {
  try {
    const { formId, fieldId, input, sessionId, isStart, isEnd } = req.body;
    if (!formId || !fieldId || !input) {
      return res.status(404).send({ errorMessage: "Something went Wrong" });
    }
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).send({ errorMessage: "Something went Wrong" });
    }
    let formData = await FormData.findOne({ form: formId, sessionId });
    if (!formData) {
      formData = new FormData({
        form: formId,
        data: new Map(),
        sessionId,
      });
    }

    formData.data.set(fieldId, input);
    await formData.save();

    let updateQuery = {};

    if (form.firstInput && form.firstInput.toString() === fieldId) {
      updateQuery.$inc = { start: 1 };
    }

    if (form.lastInput && form.lastInput.toString() === fieldId) {
      if (updateQuery.$inc) {
        updateQuery.$inc.end = 1;
      } else {
        updateQuery.$inc = { end: 1 };
      }
    }

    if (Object.keys(updateQuery).length > 0) {
      await Form.updateOne({ _id: formId }, updateQuery);
    }

    res.status(201).send(true);
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

const getAllFormData = async (req, res) => {
  try {
    const formId = req.params.formId;
    if (!formId) {
      return res.status(400).send({ errorMessage: "Bad Request" });
    }

    // Retrieve the form by ID
    const form = await Form.findById(formId)
      .select("fields start end views")
      .lean();
    if (!form) {
      return res.status(404).send({ errorMessage: "Bad Request" });
    }

    // Retrieve all FormData entries for the form
    const formDataEntries = await FormData.find({ form: formId }).lean();
    res.status(200).send({ form: form, formDataEntries: formDataEntries });
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

module.exports = {
  createFolder,
  getAllFolder,
  deleteFolder,
  createForm,
  updateForm,
  getForm,
  getAllForm,
  addFormData,
  getUserForm,
  deleteForm,
  getAllFormData,
};
