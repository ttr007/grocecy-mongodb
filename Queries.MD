# Query Implementation and Frequency Estimation

Five queries were implemented as MongoDB aggregations or finds. Each has an estimated daily frequency, which was used to decide which queries were worth optimizing: a slow query that runs once a day matters less than a moderately slow one that runs constantly.

| # | Question | Technique | Est. frequency |
|---|---|---|---|
| 1 | Which products belong to more than one category? | Self-join | ~1 per day, if at all |
| 2 | What are the top five cities by employment? | Group by | ~1 per day (store logistics check) |
| 3 | Who is the employee with ID 12? | Lookup by ID | ~5 per day |
| 4 | What city does the employee with ID 12 live in? | Join | ~5 per day |
| 5 | When is the birthday of the employee with ID 12? | Projection | ~1 per day |

## 1. Products in more than one category (self-join)

```js
db.products.aggregate([
  { $lookup: {
      from: "products",
      localField: "ProductID",
      foreignField: "ProductID",
      as: "matchedProducts"
  } },
  { $unwind: "$matchedProducts" },
  { $match: { $expr: { $ne: ["$CategoryID", "$matchedProducts.CategoryID"] } } },
  { $group: {
      _id: "$ProductID",
      ProductName: { $first: "$ProductName" },
      Categories: { $addToSet: "$CategoryID" }
  } }
]);
```

The collection is joined to itself on `ProductID`, keeping only the pairs whose `CategoryID` differs, then grouped so each product lists every category it belongs to.

## 2. Top five cities by employment (group by)

```js
db.cities.aggregate([
  { $lookup: {
      from: "employees",
      localField: "CityID",
      foreignField: "CityID",
      as: "employee_info"
  } },
  { $unwind: "$employee_info" },
  { $group: { _id: "$CityID", numEmployees: { $sum: 1 } } },
  { $sort: { numEmployees: -1 } },
  { $limit: 5 }
]);
```

## 3. Employee with ID 12

```js
db.employees.find({ EmployeeID: 12 });
```

## 4. City of the employee with ID 12

```js
db.employees.aggregate([
  { $match: { EmployeeID: 12 } },
  { $lookup: {
      from: "cities",
      localField: "CityID",
      foreignField: "CityID",
      as: "CityDetails"
  } },
  { $unwind: "$CityDetails" },
  { $project: { _id: 0, CityName: "$CityDetails.CityName" } }
]);
```

## 5. Birthday of the employee with ID 12

```js
db.employees.find(
  { EmployeeID: 12 },
  { _id: 0, FirstName: 1, LastName: 1, BirthDate: 1 }
);
```

## Why frequency estimates matter

Indexes speed up reads but cost storage and slow down writes. Estimating how often each query runs gave the team a way to judge whether an index was worth keeping. See [optimization.md](optimization.md) for the experiments.
