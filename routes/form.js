const express = require("express");
const { verifyToken } = require("../Middleware/verifyToken");
const {
  getAllFolder,
  createFolder,
  deleteFolder,
  createForm,
  updateForm,
  getForm,
  getAllForm,
  addFormData,
  getUserForm,
  deleteForm,
  getAllFormData,
} = require("../controllers/form");
const { validateForm } = require("../Middleware/validateForm");
const router = express.Router();

router.post("/create-folder", verifyToken, createFolder);
router.get("/get-all-folder", verifyToken, getAllFolder);
router.delete("/delete-folder/:folderId", verifyToken, deleteFolder);
router.post("/create-form", verifyToken, validateForm, createForm);
router.post("/update-form/:formId", verifyToken, validateForm, updateForm);
router.get("/get-form/:formId", getForm);
router.get("/get-all-form/:folderId", verifyToken, getAllForm);
router.post("/add-form-data/", addFormData);
router.get("/get-user-form/:formId", getUserForm);
router.delete("/delete-form/:formId", verifyToken, deleteForm);
router.get("/get-form-data/:formId", verifyToken, getAllFormData);

module.exports = router;
