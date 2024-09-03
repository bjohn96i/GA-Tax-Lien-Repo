# GA Tax Lien Backend

## Requirements

- Node 20.17.0 (LTS)
- A Instance of MongoDB

## Installation

1. Clone this Repo: `git clone https://github.com/bjohn96i/GA-Tax-Lien-Repo.git`
2. Navigate into this folder: `cd GA-Tax-Lien-Repo`
3. Install the project with `npm install`

## Injestion

This relies on data from the [Dekalb County Delinquent Tax List](https://dekalbtax.org/delinquent-tax). Before you can run the api, you will need to parse the data from the Delinquent Tax list from the property appraisal office. To parse and store that data in MongoDB follow the following steps:

1. Create a .env file with the information for your database. Example:

```
DB_URI = 'mongodb+srv://<username>:<password>@cluster0.ov11mon.mongodb.net/deedData?retryWrites=true&w=majority'
PORT = <port_number>
```

2. Download the [Delinquent Tax List](https://dekalbtax.org/delinquent-tax) from the Property Appraisers website and place it in `injestor\files`
3. Modify the file path in `injestor.js:36`
4. Run the following command: `npm run injest`
5. If the injestion was successful, you should now have a `deedData.taxDeeds` collection with property data objects.

## Running the Backend

This will launch the backend api for this project. Please be sure that you have injested the data from the steps above.

1. To launch the backend, run the following command: `npm run dev`

## Endpoints:

## **Return All Properties**

This endpoint fetches all properties in the database.

- **URL**

  /

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  None

  **Optional:**

  `limit=[integer]`
  `page=[integer]`

## **Return Specified Property**

This endpoint fetches a single property based on the property ID in the database.

- **URL**

  /:id

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  None

  **Optional:**

  `limit=[integer]`
  `page=[integer]`

## **Return Specified Property Appreciation Potential**

This endpoint fetches the data for single property based on the property ID and calculates the appreciation potential based on data retrieved from the appraisal office.

- **URL**

  /properties/potential/:id

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  None

  **Optional:**

  `limit=[integer]`
  `page=[integer]`

## **Search Properties**

Search for properties using specied search parameters.

- **URL**

  /properties/search

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  None

  **Optional:**
  `status=[string]`
  `address=[string]`
  `city=[string]`
  `zip=[string]`
  `propertyClass=[string]`
  `code=[string]`
  `appraiser=[string]`
  `owners=[string]`
  `limit=[integer]`
  `page=[integer]`
