const validateForm = (req, res, next) => {
  try {
    const formData = req.body;
    if (!formData.formName || formData.formName.trim().length == 0) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }
    if (!formData.theme || ![1, 2, 3].includes(formData.theme)) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }

    if (
      !formData.fields ||
      !Array.isArray(formData.fields) ||
      formData.fields.length == 0 ||
      !formData.fieldTypeArray ||
      !Array.isArray(formData.fieldTypeArray)
    ) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }

    const totalFields = formData.fieldTypeArray.reduce(
      (acc, val) => acc + val,
      0
    );
    if (formData.fields.length != totalFields) {
      return res.status(400).send({ errorMessage: "Bad request" });
    }

    const fields = [];
    for (let formI = 0; formI < formData.fields.length; formI++) {
      const field = formData.fields[formI];
      if (
        !field.fieldName ||
        !field.count ||
        typeof field.isBubble !== "boolean" ||
        !field.fieldType ||
        ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(field.fieldType)
      ) {
        return res.status(400).send({ errorMessage: "Bad request" });
      }

      if ([1, 2, 3, 4, 11].includes(field.fieldType)) {
        if (!field.fieldValue || field.fieldValue.trim().length == 0) {
          return res.status(400).send({ errorMessage: "Bad request" });
        }
      }

      if (
        !field.count ||
        (field.count > formData.fieldTypeArray[field.fieldType - 1] &&
          field.count <= 0)
      ) {
        return res.status(400).send({ errorMessage: "Bad request" });
      }
      const fieldWithUpdatedCount = {
        fieldName: field.fieldName,
        isBubble: field.isBubble,
        fieldType: field.fieldType,
        fieldValue: field.fieldValue || "",
        fieldTypeCount: field.count,
      };

      if (field?._id) {
        fieldWithUpdatedCount._id = field._id;
      }

      fields.push(fieldWithUpdatedCount);
    }
    formData.fields = fields;
    next();
  } catch (error) {
    return res.status(500).send({ errorMessage: "Internal server error" });
  }
};

function isDate(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return !isNaN(value);
  } else if (typeof value === "string") {
    const parsedDate = new Date(value);
    return !isNaN(parsedDate);
  }
  return false;
}

module.exports = {
  validateForm,
};
