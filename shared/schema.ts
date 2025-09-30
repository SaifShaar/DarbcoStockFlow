import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  serial,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Password field for local auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("viewer"),
  warehouseScope: text("warehouse_scope").array(),
  departmentScope: text("department_scope").array(),
  supplierScope: text("supplier_scope").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "manager", "operator", "viewer"]),
  warehouseScope: z.array(z.string()).nullable().optional(),
  departmentScope: z.array(z.string()).nullable().optional(),
  supplierScope: z.array(z.string()).nullable().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Login schema for authentication
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSchema = insertUserSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

// Enums
export const transactionTypeEnum = pgEnum("transaction_type", [
  "GRN",
  "PUTAWAY",
  "ISSUE",
  "RETURN",
  "TRANSFER",
  "ADJUST",
  "ASSEMBLY_BUILD",
  "ASSEMBLY_UNBUILD",
]);

export const statusEnum = pgEnum("status", [
  "draft",
  "pending",
  "approved",
  "rejected",
  "released",
  "in_progress",
  "completed",
  "cancelled",
  "closed",
  "converted",
]);

export const valuationMethodEnum = pgEnum("valuation_method", ["FIFO", "WAV"]);

// Core Tables
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }),
  location: text("location"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bins = pgTable("bins", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }),
  aisle: varchar("aisle", { length: 10 }),
  rack: varchar("rack", { length: 10 }),
  shelf: varchar("shelf", { length: 10 }),
  capacity: decimal("capacity", { precision: 15, scale: 4 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  addressAr: text("address_ar"),
  vatNumber: varchar("vat_number", { length: 50 }),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  leadTime: integer("lead_time"), // days
  currency: varchar("currency", { length: 3 }).default("JOD"),
  isActive: boolean("is_active").default(true),
  score: decimal("score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }),
  description: text("description"),
  descriptionAr: text("description_ar"),
  specification: text("specification"),
  specificationAr: text("specification_ar"),
  uom: varchar("uom", { length: 10 }).notNull(), // Unit of Measure
  category: varchar("category", { length: 100 }),
  categoryAr: varchar("category_ar", { length: 100 }),
  abcClassification: varchar("abc_classification", { length: 1 }),
  xyzClassification: varchar("xyz_classification", { length: 1 }),
  minStock: decimal("min_stock", { precision: 15, scale: 4 }),
  maxStock: decimal("max_stock", { precision: 15, scale: 4 }),
  reorderPoint: decimal("reorder_point", { precision: 15, scale: 4 }),
  leadTime: integer("lead_time"), // days
  defaultSupplierId: integer("default_supplier_id").references(
    () => suppliers.id,
  ),
  requiresBatch: boolean("requires_batch").default(false),
  requiresSerial: boolean("requires_serial").default(false),
  imageUrl: varchar("image_url", { length: 500 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const boms = pgTable("boms", {
  id: serial("id").primaryKey(),
  parentItemId: integer("parent_item_id")
    .references(() => items.id)
    .notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  isActive: boolean("is_active").default(false),
  effectiveDate: date("effective_date"),
  backflushEnabled: boolean("backflush_enabled").default(false),
  autoReserveEnabled: boolean("auto_reserve_enabled").default(false),
  leadTime: integer("lead_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bomLines = pgTable("bom_lines", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id")
    .references(() => boms.id)
    .notNull(),
  componentItemId: integer("component_item_id")
    .references(() => items.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  uom: varchar("uom", { length: 10 }).notNull(),
  wastagePercent: decimal("wastage_percent", {
    precision: 5,
    scale: 2,
  }).default("0"),
  alternativeItemId: integer("alternative_item_id").references(() => items.id),
  backflushDefault: boolean("backflush_default").default(true),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const partsLists = pgTable("parts_lists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }),
  description: text("description"),
  descriptionAr: text("description_ar"),
  category: varchar("category", { length: 50 }),
  isTemplate: boolean("is_template").default(true),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by")
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const partsListLines = pgTable("parts_list_lines", {
  id: serial("id").primaryKey(),
  partsListId: integer("parts_list_id")
    .references(() => partsLists.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  uom: varchar("uom", { length: 10 }).notNull(),
  notes: text("notes"),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rfqs = pgTable("rfqs", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  requestDate: date("request_date").notNull(),
  responseDeadline: date("response_deadline"),
  status: statusEnum("status").default("draft"),
  createdBy: varchar("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rfqLines = pgTable("rfq_lines", {
  id: serial("id").primaryKey(),
  rfqId: integer("rfq_id")
    .references(() => rfqs.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  uom: varchar("uom", { length: 10 }).notNull(),
  requiredDate: date("required_date"),
  specifications: text("specifications"),
  specificationsAr: text("specifications_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  rfqId: integer("rfq_id")
    .references(() => rfqs.id)
    .notNull(),
  supplierId: integer("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  quoteNumber: varchar("quote_number", { length: 50 }),
  quoteDate: date("quote_date").notNull(),
  validUntil: date("valid_until"),
  currency: varchar("currency", { length: 3 }).default("JOD"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }),
  leadTime: integer("lead_time"),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  status: statusEnum("status").default("pending"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdBy: varchar("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quoteLines = pgTable("quote_lines", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id")
    .references(() => quotes.id)
    .notNull(),
  rfqLineId: integer("rfq_line_id")
    .references(() => rfqLines.id)
    .notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 4 }).notNull(),
  lineAmount: decimal("line_amount", { precision: 15, scale: 2 }).notNull(),
  leadTime: integer("lead_time"),
  moq: decimal("moq", { precision: 15, scale: 4 }), // Minimum Order Quantity
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  supplierId: integer("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  orderDate: date("order_date").notNull(),
  deliveryDate: date("delivery_date"),
  currency: varchar("currency", { length: 3 }).default("JOD"),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("16"), // Jordan VAT
  vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  deliveryTerms: varchar("delivery_terms", { length: 100 }),
  status: statusEnum("status").default("draft"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdBy: varchar("created_by")
    .references(() => users.id)
    .notNull(),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const purchaseOrderLines = pgTable("purchase_order_lines", {
  id: serial("id").primaryKey(),
  poId: integer("po_id")
    .references(() => purchaseOrders.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  uom: varchar("uom", { length: 10 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 4 }).notNull(),
  lineAmount: decimal("line_amount", { precision: 15, scale: 2 }).notNull(),
  deliveryDate: date("delivery_date"),
  receivedQuantity: decimal("received_quantity", {
    precision: 15,
    scale: 4,
  }).default("0"),
  specifications: text("specifications"),
  specificationsAr: text("specifications_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const grns = pgTable("grns", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  poId: integer("po_id").references(() => purchaseOrders.id),
  supplierId: integer("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  warehouseId: integer("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  receiptDate: date("receipt_date").notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  deliveryNote: varchar("delivery_note", { length: 50 }),
  transportCompany: varchar("transport_company", { length: 255 }),
  status: statusEnum("status").default("draft"),
  inspectionRequired: boolean("inspection_required").default(false),
  inspectedBy: varchar("inspected_by").references(() => users.id),
  inspectedAt: timestamp("inspected_at"),
  receivedBy: varchar("received_by")
    .references(() => users.id)
    .notNull(),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const grnLines = pgTable("grn_lines", {
  id: serial("id").primaryKey(),
  grnId: integer("grn_id")
    .references(() => grns.id)
    .notNull(),
  poLineId: integer("po_line_id").references(() => purchaseOrderLines.id),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  orderedQuantity: decimal("ordered_quantity", { precision: 15, scale: 4 }),
  receivedQuantity: decimal("received_quantity", {
    precision: 15,
    scale: 4,
  }).notNull(),
  uom: varchar("uom", { length: 10 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  batchNumber: varchar("batch_number", { length: 50 }),
  serialNumber: varchar("serial_number", { length: 50 }),
  expiryDate: date("expiry_date"),
  qualityStatus: varchar("quality_status", { length: 20 }).default("pending"),
  defectQuantity: decimal("defect_quantity", {
    precision: 15,
    scale: 4,
  }).default("0"),
  acceptedQuantity: decimal("accepted_quantity", { precision: 15, scale: 4 }),
  rejectedQuantity: decimal("rejected_quantity", {
    precision: 15,
    scale: 4,
  }).default("0"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  bomId: integer("bom_id").references(() => boms.id),
  plannedQuantity: decimal("planned_quantity", {
    precision: 15,
    scale: 4,
  }).notNull(),
  completedQuantity: decimal("completed_quantity", {
    precision: 15,
    scale: 4,
  }).default("0"),
  scrapQuantity: decimal("scrap_quantity", { precision: 15, scale: 4 }).default(
    "0",
  ),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  completionDate: date("completion_date"),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  priority: varchar("priority", { length: 10 }).default("normal"),
  status: statusEnum("status").default("draft"),
  releasedBy: varchar("released_by").references(() => users.id),
  releasedAt: timestamp("released_at"),
  createdBy: varchar("created_by")
    .references(() => users.id)
    .notNull(),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mins = pgTable("mins", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  warehouseId: integer("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  workOrderId: integer("work_order_id").references(() => workOrders.id),
  department: varchar("department", { length: 100 }),
  requestedBy: varchar("requested_by")
    .references(() => users.id)
    .notNull(),
  issuedBy: varchar("issued_by").references(() => users.id),
  issueDate: date("issue_date").notNull(),
  purpose: text("purpose"),
  purposeAr: text("purpose_ar"),
  status: statusEnum("status").default("draft"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const minLines = pgTable("min_lines", {
  id: serial("id").primaryKey(),
  minId: integer("min_id")
    .references(() => mins.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  requestedQuantity: decimal("requested_quantity", {
    precision: 15,
    scale: 4,
  }).notNull(),
  issuedQuantity: decimal("issued_quantity", {
    precision: 15,
    scale: 4,
  }).default("0"),
  uom: varchar("uom", { length: 10 }).notNull(),
  binId: integer("bin_id").references(() => bins.id),
  batchNumber: varchar("batch_number", { length: 50 }),
  serialNumber: varchar("serial_number", { length: 50 }),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mrns = pgTable("mrns", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  warehouseId: integer("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  minId: integer("min_id").references(() => mins.id),
  workOrderId: integer("work_order_id").references(() => workOrders.id),
  returnedBy: varchar("returned_by")
    .references(() => users.id)
    .notNull(),
  receivedBy: varchar("received_by").references(() => users.id),
  returnDate: date("return_date").notNull(),
  reason: varchar("reason", { length: 100 }),
  reasonAr: varchar("reason_ar", { length: 100 }),
  status: statusEnum("status").default("draft"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mrnLines = pgTable("mrn_lines", {
  id: serial("id").primaryKey(),
  mrnId: integer("mrn_id")
    .references(() => mrns.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  returnedQuantity: decimal("returned_quantity", {
    precision: 15,
    scale: 4,
  }).notNull(),
  uom: varchar("uom", { length: 10 }).notNull(),
  binId: integer("bin_id").references(() => bins.id),
  batchNumber: varchar("batch_number", { length: 50 }),
  serialNumber: varchar("serial_number", { length: 50 }),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  condition: varchar("condition", { length: 50 }).default("good"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transfer Tables
export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  fromWarehouseId: integer("from_warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  toWarehouseId: integer("to_warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  transferDate: date("transfer_date").notNull(),
  transferredBy: varchar("transferred_by")
    .references(() => users.id)
    .notNull(),
  receivedBy: varchar("received_by").references(() => users.id),
  status: statusEnum("status").default("pending"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transferLines = pgTable("transfer_lines", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id")
    .references(() => transfers.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  uom: varchar("uom", { length: 10 }).notNull(),
  fromBinId: integer("from_bin_id").references(() => bins.id),
  toBinId: integer("to_bin_id").references(() => bins.id),
  batchNumber: varchar("batch_number", { length: 50 }),
  serialNumber: varchar("serial_number", { length: 50 }),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Adjustment Tables
export const adjustments = pgTable("adjustments", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  warehouseId: integer("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  adjustmentDate: date("adjustment_date").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  reasonAr: varchar("reason_ar", { length: 255 }),
  adjustedBy: varchar("adjusted_by")
    .references(() => users.id)
    .notNull(),
  status: statusEnum("status").default("pending"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adjustmentLines = pgTable("adjustment_lines", {
  id: serial("id").primaryKey(),
  adjustmentId: integer("adjustment_id")
    .references(() => adjustments.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  adjustmentType: varchar("adjustment_type", { length: 10 }).notNull(), // 'increase' or 'decrease'
  uom: varchar("uom", { length: 10 }).notNull(),
  binId: integer("bin_id").references(() => bins.id),
  batchNumber: varchar("batch_number", { length: 50 }),
  serialNumber: varchar("serial_number", { length: 50 }),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dtr = pgTable("dtr", {
  id: serial("id").primaryKey(),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  voucherNumber: varchar("voucher_number", { length: 50 }).notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  warehouseId: integer("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  binId: integer("bin_id").references(() => bins.id),
  batchNumber: varchar("batch_number", { length: 50 }),
  serialNumber: varchar("serial_number", { length: 50 }),
  quantityIn: decimal("quantity_in", { precision: 15, scale: 4 }).default("0"),
  quantityOut: decimal("quantity_out", { precision: 15, scale: 4 }).default(
    "0",
  ),
  uom: varchar("uom", { length: 10 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  totalCost: decimal("total_cost", { precision: 15, scale: 2 }),
  runningBalance: decimal("running_balance", { precision: 15, scale: 4 }),
  workOrderId: integer("work_order_id").references(() => workOrders.id),
  createdBy: varchar("created_by")
    .references(() => users.id)
    .notNull(),
  reference: text("reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockLevels = pgTable("stock_levels", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  warehouseId: integer("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  binId: integer("bin_id").references(() => bins.id),
  batchNumber: varchar("batch_number", { length: 50 }),
  serialNumber: varchar("serial_number", { length: 50 }),
  quantity: decimal("quantity", { precision: 15, scale: 4 })
    .notNull()
    .default("0"),
  reservedQuantity: decimal("reserved_quantity", {
    precision: 15,
    scale: 4,
  }).default("0"),
  availableQuantity: decimal("available_quantity", { precision: 15, scale: 4 })
    .notNull()
    .default("0"),
  averageCost: decimal("average_cost", { precision: 15, scale: 4 }),
  lastTransactionDate: timestamp("last_transaction_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  descriptionAr: text("description_ar"),
  category: varchar("category", { length: 50 }),
  dataType: varchar("data_type", { length: 20 }).default("string"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const warehouseRelations = relations(warehouses, ({ many }) => ({
  bins: many(bins),
  stockLevels: many(stockLevels),
}));

export const binRelations = relations(bins, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [bins.warehouseId],
    references: [warehouses.id],
  }),
  stockLevels: many(stockLevels),
}));

export const supplierRelations = relations(suppliers, ({ many }) => ({
  items: many(items),
  quotes: many(quotes),
  purchaseOrders: many(purchaseOrders),
  grns: many(grns),
}));

export const itemRelations = relations(items, ({ one, many }) => ({
  defaultSupplier: one(suppliers, {
    fields: [items.defaultSupplierId],
    references: [suppliers.id],
  }),
  boms: many(boms),
  bomLines: many(bomLines),
  stockLevels: many(stockLevels),
  dtrEntries: many(dtr),
}));

export const bomRelations = relations(boms, ({ one, many }) => ({
  parentItem: one(items, {
    fields: [boms.parentItemId],
    references: [items.id],
  }),
  bomLines: many(bomLines),
  workOrders: many(workOrders),
}));

export const bomLineRelations = relations(bomLines, ({ one }) => ({
  bom: one(boms, {
    fields: [bomLines.bomId],
    references: [boms.id],
  }),
  componentItem: one(items, {
    fields: [bomLines.componentItemId],
    references: [items.id],
  }),
  alternativeItem: one(items, {
    fields: [bomLines.alternativeItemId],
    references: [items.id],
  }),
}));

export const rfqRelations = relations(rfqs, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [rfqs.createdBy],
    references: [users.id],
  }),
  rfqLines: many(rfqLines),
  quotes: many(quotes),
}));

export const rfqLineRelations = relations(rfqLines, ({ one, many }) => ({
  rfq: one(rfqs, {
    fields: [rfqLines.rfqId],
    references: [rfqs.id],
  }),
  item: one(items, {
    fields: [rfqLines.itemId],
    references: [items.id],
  }),
  quoteLines: many(quoteLines),
}));

export const quoteRelations = relations(quotes, ({ one, many }) => ({
  rfq: one(rfqs, {
    fields: [quotes.rfqId],
    references: [rfqs.id],
  }),
  supplier: one(suppliers, {
    fields: [quotes.supplierId],
    references: [suppliers.id],
  }),
  quoteLines: many(quoteLines),
}));

export const quoteLineRelations = relations(quoteLines, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteLines.quoteId],
    references: [quotes.id],
  }),
  rfqLine: one(rfqLines, {
    fields: [quoteLines.rfqLineId],
    references: [rfqLines.id],
  }),
}));

export const purchaseOrderRelations = relations(
  purchaseOrders,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [purchaseOrders.supplierId],
      references: [suppliers.id],
    }),
    createdByUser: one(users, {
      fields: [purchaseOrders.createdBy],
      references: [users.id],
    }),
    approvedByUser: one(users, {
      fields: [purchaseOrders.approvedBy],
      references: [users.id],
    }),
    purchaseOrderLines: many(purchaseOrderLines),
    grns: many(grns),
  }),
);

export const purchaseOrderLineRelations = relations(
  purchaseOrderLines,
  ({ one, many }) => ({
    purchaseOrder: one(purchaseOrders, {
      fields: [purchaseOrderLines.poId],
      references: [purchaseOrders.id],
    }),
    item: one(items, {
      fields: [purchaseOrderLines.itemId],
      references: [items.id],
    }),
    grnLines: many(grnLines),
  }),
);

export const grnRelations = relations(grns, ({ one, many }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [grns.poId],
    references: [purchaseOrders.id],
  }),
  supplier: one(suppliers, {
    fields: [grns.supplierId],
    references: [suppliers.id],
  }),
  warehouse: one(warehouses, {
    fields: [grns.warehouseId],
    references: [warehouses.id],
  }),
  receivedByUser: one(users, {
    fields: [grns.receivedBy],
    references: [users.id],
  }),
  inspectedByUser: one(users, {
    fields: [grns.inspectedBy],
    references: [users.id],
  }),
  grnLines: many(grnLines),
}));

export const grnLineRelations = relations(grnLines, ({ one }) => ({
  grn: one(grns, {
    fields: [grnLines.grnId],
    references: [grns.id],
  }),
  purchaseOrderLine: one(purchaseOrderLines, {
    fields: [grnLines.poLineId],
    references: [purchaseOrderLines.id],
  }),
  item: one(items, {
    fields: [grnLines.itemId],
    references: [items.id],
  }),
}));

export const workOrderRelations = relations(workOrders, ({ one, many }) => ({
  item: one(items, {
    fields: [workOrders.itemId],
    references: [items.id],
  }),
  bom: one(boms, {
    fields: [workOrders.bomId],
    references: [boms.id],
  }),
  warehouse: one(warehouses, {
    fields: [workOrders.warehouseId],
    references: [warehouses.id],
  }),
  createdByUser: one(users, {
    fields: [workOrders.createdBy],
    references: [users.id],
  }),
  releasedByUser: one(users, {
    fields: [workOrders.releasedBy],
    references: [users.id],
  }),
  mins: many(mins),
  mrns: many(mrns),
  dtrEntries: many(dtr),
}));

export const minRelations = relations(mins, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [mins.warehouseId],
    references: [warehouses.id],
  }),
  workOrder: one(workOrders, {
    fields: [mins.workOrderId],
    references: [workOrders.id],
  }),
  requestedByUser: one(users, {
    fields: [mins.requestedBy],
    references: [users.id],
  }),
  issuedByUser: one(users, {
    fields: [mins.issuedBy],
    references: [users.id],
  }),
  minLines: many(minLines),
  mrns: many(mrns),
}));

export const minLineRelations = relations(minLines, ({ one }) => ({
  min: one(mins, {
    fields: [minLines.minId],
    references: [mins.id],
  }),
  item: one(items, {
    fields: [minLines.itemId],
    references: [items.id],
  }),
  bin: one(bins, {
    fields: [minLines.binId],
    references: [bins.id],
  }),
}));

export const mrnRelations = relations(mrns, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [mrns.warehouseId],
    references: [warehouses.id],
  }),
  min: one(mins, {
    fields: [mrns.minId],
    references: [mins.id],
  }),
  workOrder: one(workOrders, {
    fields: [mrns.workOrderId],
    references: [workOrders.id],
  }),
  returnedByUser: one(users, {
    fields: [mrns.returnedBy],
    references: [users.id],
  }),
  receivedByUser: one(users, {
    fields: [mrns.receivedBy],
    references: [users.id],
  }),
  mrnLines: many(mrnLines),
}));

export const mrnLineRelations = relations(mrnLines, ({ one }) => ({
  mrn: one(mrns, {
    fields: [mrnLines.mrnId],
    references: [mrns.id],
  }),
  item: one(items, {
    fields: [mrnLines.itemId],
    references: [items.id],
  }),
  bin: one(bins, {
    fields: [mrnLines.binId],
    references: [bins.id],
  }),
}));

export const dtrRelations = relations(dtr, ({ one }) => ({
  item: one(items, {
    fields: [dtr.itemId],
    references: [items.id],
  }),
  warehouse: one(warehouses, {
    fields: [dtr.warehouseId],
    references: [warehouses.id],
  }),
  bin: one(bins, {
    fields: [dtr.binId],
    references: [bins.id],
  }),
  workOrder: one(workOrders, {
    fields: [dtr.workOrderId],
    references: [workOrders.id],
  }),
  createdByUser: one(users, {
    fields: [dtr.createdBy],
    references: [users.id],
  }),
}));

export const stockLevelRelations = relations(stockLevels, ({ one }) => ({
  item: one(items, {
    fields: [stockLevels.itemId],
    references: [items.id],
  }),
  warehouse: one(warehouses, {
    fields: [stockLevels.warehouseId],
    references: [warehouses.id],
  }),
  bin: one(bins, {
    fields: [stockLevels.binId],
    references: [bins.id],
  }),
}));

// Insert and Select Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertWarehouse = typeof warehouses.$inferInsert;
export type Warehouse = typeof warehouses.$inferSelect;

export type InsertBin = typeof bins.$inferInsert;
export type Bin = typeof bins.$inferSelect;

export type InsertSupplier = typeof suppliers.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;

export type InsertItem = typeof items.$inferInsert;
export type Item = typeof items.$inferSelect;

export type InsertBom = typeof boms.$inferInsert;
export type Bom = typeof boms.$inferSelect;

export type InsertBomLine = typeof bomLines.$inferInsert;
export type BomLine = typeof bomLines.$inferSelect;

export type InsertPartsList = typeof partsLists.$inferInsert;
export type PartsList = typeof partsLists.$inferSelect;

export type InsertPartsListLine = typeof partsListLines.$inferInsert;
export type PartsListLine = typeof partsListLines.$inferSelect;

export type InsertRfq = typeof rfqs.$inferInsert;
export type Rfq = typeof rfqs.$inferSelect;

export type InsertRfqLine = typeof rfqLines.$inferInsert;
export type RfqLine = typeof rfqLines.$inferSelect;

export type InsertQuote = typeof quotes.$inferInsert;
export type Quote = typeof quotes.$inferSelect;

export type InsertQuoteLine = typeof quoteLines.$inferInsert;
export type QuoteLine = typeof quoteLines.$inferSelect;

export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

export type InsertPurchaseOrderLine = typeof purchaseOrderLines.$inferInsert;
export type PurchaseOrderLine = typeof purchaseOrderLines.$inferSelect;

export type InsertGrn = typeof grns.$inferInsert;
export type Grn = typeof grns.$inferSelect;

export type InsertGrnLine = typeof grnLines.$inferInsert;
export type GrnLine = typeof grnLines.$inferSelect;

export type InsertWorkOrder = typeof workOrders.$inferInsert;
export type WorkOrder = typeof workOrders.$inferSelect;

export type InsertMin = typeof mins.$inferInsert;
export type Min = typeof mins.$inferSelect;

export type InsertMinLine = typeof minLines.$inferInsert;
export type MinLine = typeof minLines.$inferSelect;

export type InsertMrn = typeof mrns.$inferInsert;
export type Mrn = typeof mrns.$inferSelect;

export type InsertMrnLine = typeof mrnLines.$inferInsert;
export type MrnLine = typeof mrnLines.$inferSelect;

export type InsertDtr = typeof dtr.$inferInsert;
export type Dtr = typeof dtr.$inferSelect;

export type InsertStockLevel = typeof stockLevels.$inferInsert;
export type StockLevel = typeof stockLevels.$inferSelect;

export type InsertSetting = typeof settings.$inferInsert;
export type Setting = typeof settings.$inferSelect;

// Zod Schemas for Validation
export const insertWarehouseSchema = createInsertSchema(warehouses);
export const insertBinSchema = createInsertSchema(bins);
export const insertSupplierSchema = createInsertSchema(suppliers);
export const insertItemSchema = createInsertSchema(items, {
  minStock: z.number().nullable().optional(),
  maxStock: z.number().nullable().optional(),
  reorderPoint: z.number().nullable().optional(),
  leadTime: z.number().nullable().optional(),
});
export const insertBomSchema = createInsertSchema(boms);
export const insertBomLineSchema = createInsertSchema(bomLines);
export const insertPartsListSchema = createInsertSchema(partsLists);
export const insertPartsListLineSchema = createInsertSchema(partsListLines);
export const insertRfqSchema = createInsertSchema(rfqs);
export const insertRfqLineSchema = createInsertSchema(rfqLines);
export const insertQuoteSchema = createInsertSchema(quotes);
export const insertQuoteLineSchema = createInsertSchema(quoteLines);
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders);
export const insertPurchaseOrderLineSchema =
  createInsertSchema(purchaseOrderLines);
export const insertGrnSchema = createInsertSchema(grns);
export const insertGrnLineSchema = createInsertSchema(grnLines);
export const insertWorkOrderSchema = createInsertSchema(workOrders);
export const insertMinSchema = createInsertSchema(mins);
export const insertMinLineSchema = createInsertSchema(minLines);
export const insertMrnSchema = createInsertSchema(mrns);
export const insertMrnLineSchema = createInsertSchema(mrnLines);
export const insertTransferSchema = createInsertSchema(transfers);
export const insertTransferLineSchema = createInsertSchema(transferLines);
export const insertAdjustmentSchema = createInsertSchema(adjustments);
export const insertAdjustmentLineSchema = createInsertSchema(adjustmentLines);
export const insertDtrSchema = createInsertSchema(dtr);
export const insertStockLevelSchema = createInsertSchema(stockLevels);
export const insertSettingSchema = createInsertSchema(settings);
