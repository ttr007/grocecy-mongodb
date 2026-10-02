# Database Design

## 1. Entity-Relationship Diagram

![ER diagram of the national grocery database](/images/erd.png)

The diagram models how a national grocery system tracks cities, customers, product categories, products, employees, and sales, and how those entities relate to each other.

## 2. Business questions

The schema was designed around 20 questions that different stakeholders might ask:

1. What are the top five countries in grocery sales?
2. What is the last name of the customer with ID 123?
3. What product category has the most sales?
4. Which store has the most sales of the least popular product category? (witness)
5. Which store has the most sales of the top 5 product categories? (witness)
6. Which store has the most sales?
7. What city has the most customers?
8. What products (if any) belong to more than one category? (self-join)
9. What were the total sales per month for each category (all 11)?
10. Which country is involved in the most snail sales?
11. What city has the highest ratio of populace to sales?
12. Who is the employee with ID 123?
13. Who are the top 10 employees in sales performance?
14. What are the age demographics of employees (e.g., 18-25, 25-40, 40-65, 65+)?
15. What product most commonly has allergens?
16. Which product category has the most vitality days on average?
17. What products have the highest discounts?
18. What are the top 5 product categories in total price?
19. What are the top 5 times (by hour) for sales to occur?
20. Which customer ID has bought the most groceries in terms of sales?

Several of these (such as #8, #12, #17) were implemented and tested. See [Queries.md](/Queries.md).

## 3. Database instance

The database runs on **MongoDB Atlas**, using the free cloud-hosted cluster, and was managed from a team member's laptop.

The class also offered a hosted SQL server. The team chose MongoDB instead to get hands-on experience with a non-relational database.

## 4. Loading the data

- **Source format:** seven CSV files, 6M+ rows in total.
- **Import:** MongoDB supports CSV document imports directly, so the data did not need to be restructured.
- **Cleaning:** one boolean column contained the string `"unknown"`, which was converted to `null`. Otherwise the data imported cleanly.
- **IDs:** the dataset's existing ID columns (such as `ProductID`, `CityID`, `EmployeeID`) were kept and used for relationships, rather than relying on MongoDB's auto-generated `_id` values. Mapping generated IDs back to the originals would have added cost and complexity to every ID-based lookup. The tradeoff is that reinserting a dataset this large takes a long time.

## 5. Example query

**English:** What are the customer IDs and last names of all customers who live in Dayton?

**SQL equivalent:**

```sql
SELECT CustomerID, LastName
FROM Customers
WHERE CityID = 1;
```

**MongoDB:**

```js
db.customers.find({ CityID: 1 }, { CustomerID: 1, LastName: 1, _id: 0 })
```

This returns 452 customers.
