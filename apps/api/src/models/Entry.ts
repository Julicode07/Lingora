import { Schema, model } from "mongoose"

export const CATEGORIES = ["learning", "mastered"] as const
export type Category = (typeof CATEGORIES)[number]

const entrySchema = new Schema(
  {
    type: { type: String, enum: ["word", "phrasal", "expression"], default: "word" },
    english: { type: String, required: true, trim: true },
    meaning: { type: String, required: true, trim: true },
    example: { type: String, default: "" },
    exampleEs: { type: String, default: "" },
    notes: { type: String, default: "" },
    favorite: { type: Boolean, default: false },
    category: { type: String, enum: CATEGORIES, default: "learning", index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, r: any) => {
        r.id = String(r._id)
        delete r._id
        delete r.__v
        return r
      },
    },
  }
)

export const Entry = model("Entry", entrySchema)