const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - state
 *         - city
 *         - pincode
 *         - mobile
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the customer
 *         name:
 *           type: string
 *           description: Full name of the customer
 *         address:
 *           type: string
 *           description: Street address of the customer
 *         state:
 *           type: string
 *           description: State of residence
 *         city:
 *           type: string
 *           description: City of residence
 *         village:
 *           type: string
 *           description: Village (optional)
 *         pincode:
 *           type: string
 *           description: Postal code
 *         mobile:
 *           type: string
 *           description: Mobile phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the customer
 *         createdBy:
 *           type: string
 *           description: User ID who created this customer
 *         isActive:
 *           type: boolean
 *           description: Whether the customer is active
 *         ticketCount:
 *           type: number
 *           description: Count of associated tickets
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when customer was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when customer was last updated
 *         alternateMobile:
 *           type: string
 *           description: Alternate mobile phone number
 *         alternatePersonName:
 *           type: string
 *           description: Alternate contact person name
 */
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    village: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid mobile number!`,
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          // Allow empty emails but validate format if provided
          return !v || /^\S+@\S+\.\S+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      enum: ["manual", "import", "api"],
      default: "manual",
    },
    ticketCount: {
      type: Number,
      default: 0,
    },
    tickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
      },
    ],
    alternateMobile: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid mobile number!`,
      },
    },
    alternatePersonName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
customerSchema.index({ name: 1 });
customerSchema.index({ mobile: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ pincode: 1 });
customerSchema.index({ ticketCount: 1 });

// Rename the virtual to 'customerTickets' to avoid conflict
customerSchema.virtual("customerTickets", {
  ref: "Ticket",
  localField: "_id",
  foreignField: "customerId",
});

customerSchema.virtual("installationRequests", {
  ref: "InstallationRequest",
  localField: "_id",
  foreignField: "customerId",
});

customerSchema.methods.updateTicketCount = async function () {
  const Ticket = mongoose.model("Ticket");
  const count = await Ticket.countDocuments({ customerId: this._id });
  this.ticketCount = count;
  return this.save();
};

customerSchema.methods.addTicket = async function (ticketId) {
  if (!this.tickets.includes(ticketId)) {
    this.tickets.push(ticketId);
    this.ticketCount = this.tickets.length;
    await this.save();
  }
};

customerSchema.post("save", async function (doc) {
  if (this.isNew) {
    // If there's pending ticket data in the session, associate it with this customer
    // This would need to be handled in your frontend logic
    console.log("New customer created, check for pending ticket association");
  }
});

const PaginationPlugin = require("../plugins/paginate.plugin");
PaginationPlugin.enhanceSchema(customerSchema);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
