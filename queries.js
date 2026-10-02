// Grocery database: indexes and queries
// Run in mongosh or MongoDB Compass against the grocery database.
// Explanations and runtimes: see queries.md and optimization.md

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

// Kept: speeds up filtering and sorting on discounts (descending)
db.sales.createIndex({ Discount: -1 });

// Tested and NOT kept: negligible improvement, not worth the maintenance cost
// db.products.createIndex({ ProductID: 1 });

// ---------------------------------------------------------------------------
// Top 5 discounted products
// ---------------------------------------------------------------------------

// BEFORE (~340 ms): joined every sale to products before sorting
// db.sales.aggregate([
//   { $lookup: { from: "products", localField: "ProductID", foreignField: "ProductID", as: "product_info" } },
//   { $unwind: "$product_info" },
//   { $sort: { Discount: -1 } },
//   { $limit: 5 },
//   { $project: { _id: 0, ProductName: "$product_info.ProductName", Discount: 1 } }
// ]);

// AFTER (~4 ms): filter and sort first, join afterward
db.sales.aggregate([
  { $match: { Discount: { $gt: 0 } } },
  { $sort: { Discount: -1 } },
  { $lookup: { from: "products", localField: "ProductID", foreignField: "ProductID", as: "product_info" } },
  { $unwind: "$product_info" },
  { $project: { _id: 0, ProductName: "$product_info.ProductName", Discount: 1 } },
  { $limit: 5 }
]);

// ---------------------------------------------------------------------------
// Products in more than one category (self-join), ~1/day
// ---------------------------------------------------------------------------
db.products.aggregate([
  { $lookup: { from: "products", localField: "ProductID", foreignField: "ProductID", as: "matchedProducts" } },
  { $unwind: "$matchedProducts" },
  { $match: { $expr: { $ne: ["$CategoryID", "$matchedProducts.CategoryID"] } } },
  { $group: {
      _id: "$ProductID",
      ProductName: { $first: "$ProductName" },
      Categories: { $addToSet: "$CategoryID" }
  } }
]);

// ---------------------------------------------------------------------------
// Top five cities by employment (group by), ~1/day
// ---------------------------------------------------------------------------
db.cities.aggregate([
  { $lookup: { from: "employees", localField: "CityID", foreignField: "CityID", as: "employee_info" } },
  { $unwind: "$employee_info" },
  { $group: { _id: "$CityID", numEmployees: { $sum: 1 } } },
  { $sort: { numEmployees: -1 } },
  { $limit: 5 }
]);

// ---------------------------------------------------------------------------
// Look up an employee by ID (example: 12), ~5/day
// ---------------------------------------------------------------------------
db.employees.find({ EmployeeID: 12 });

// ---------------------------------------------------------------------------
// City an employee lives in (example: employee 12), ~5/day
// ---------------------------------------------------------------------------
db.employees.aggregate([
  { $match: { EmployeeID: 12 } },
  { $lookup: { from: "cities", localField: "CityID", foreignField: "CityID", as: "CityDetails" } },
  { $unwind: "$CityDetails" },
  { $project: { _id: 0, CityName: "$CityDetails.CityName" } }
]);

// ---------------------------------------------------------------------------
// An employee's birthday (example: employee 12), ~1/day
// ---------------------------------------------------------------------------
db.employees.find(
  { EmployeeID: 12 },
  { _id: 0, FirstName: 1, LastName: 1, BirthDate: 1 }
);

// ---------------------------------------------------------------------------
// Example: customers living in Dayton (CityID 1), returns 452 customers
// ---------------------------------------------------------------------------
db.customers.find({ CityID: 1 }, { CustomerID: 1, LastName: 1, _id: 0 });
