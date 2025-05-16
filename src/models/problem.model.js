const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Problem:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID of the problem
 *         name:
 *           type: string
 *           description: Name of the problem
 *         description:
 *           type: string
 *           description: Detailed description of the problem
 *         category:
 *           type: string
 *           enum: [MINOR, MAJOR]
 *           description: Category of the problem
 *         ticketCount:
 *           type: number
 *           description: Number of tickets associated with this problem
 *         createdBy:
 *           type: string
 *           description: User ID who created the problem
 *         updatedBy:
 *           type: string
 *           description: User ID who last updated the problem
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when problem was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when problem was last updated
 */
const problemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Problem name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["MINOR", "MAJOR"],
      default: "MINOR",
    },
    ticketCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

problemSchema.index({ name: 1 });
problemSchema.index({ category: 1 });
problemSchema.index({ createdAt: -1 });
problemSchema.index({ ticketCount: 1 });

// Method to update ticket count
problemSchema.methods.updateTicketCount = async function () {
  const Ticket = mongoose.model("Ticket");
  const count = await Ticket.countDocuments({ problems: this._id });
  this.ticketCount = count;
  return this.save();
};

const PaginationPlugin = require("../plugins/paginate.plugin");
PaginationPlugin.enhanceSchema(problemSchema);

const Problem = mongoose.model("Problem", problemSchema);

module.exports = Problem;
