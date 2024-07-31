const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
    },
    theme: {
      type: Number,
      enum: [1, 2, 3],
      // bubble 1->light 2->dark 3->blue
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    views: {
      type: Number,
      default: 0,
    },
    start: {
      type: Number,
      default: 0,
    },
    end: {
      type: Number,
      default: 0,
    },
    fields: [
      {
        fieldName: {
          type: String,
          required: true,
        },
        isBubble: {
          type: Boolean,
          required: true,
        },
        fieldType: {
          type: Number,
          enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          // bubble 1->text 2->img 3->video 4->gif
          // notBubble  5->Text 6->number 7->email 8->phone 9->date 10->rating 11->button
          required: true,
        },
        fieldTypeCount: {
          type: Number,
          required: true,
        },
        fieldValue: {
          type: String,
          trim: true,
        },
      },
    ],
    firstInput: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form.fields",
    },
    lastInput: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form.fields",
    },
  },

  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("Form", formSchema);
