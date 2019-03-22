const moment = require('moment');

const Sequelize = require('sequelize');
const sequelize = require('../common/connection');

// const Order = require('./Order');

const TABLE_NAME = 'product';
const domain = `"${process.env.SRV_DOMAIN}:${process.env.SRV_PORT}/product_image/"`;

const fields = {
  product_id: {
    allowNull: true,
    primaryKey: true,
    type: Sequelize.INTEGER,
    autoIncrement: true,
  },
  name: {
    allowNull: false,
    type: Sequelize.STRING(100),
  },
  description: {
    allowNull: false,
    type: Sequelize.STRING(1000),
  },
  price: {
    allowNull: false,
    type: Sequelize.DECIMAL(10, 2),
  },
  discounted_price: {
    allowNull: false,
    type: Sequelize.DECIMAL(10, 2),
    defaultValue: '0.00',
  },
  image: {
    allowNull: true,
    type: Sequelize.STRING(150),
  },
  image_2: {
    allowNull: true,
    type: Sequelize.STRING(150),
  },
  thumbnail: {
    allowNull: true,
    type: Sequelize.STRING(150),
  },
  display: {
    allowNull: false,
    type: Sequelize.INTEGER(6),
    defaultValue: 0,
  },
};

const model = sequelize.define(TABLE_NAME, fields, { freezeTableName: true, timestamps: false });

model.hasData = () => sequelize
  .query(
    'SELECT COUNT(*) count FROM product',
    {
      type: sequelize.QueryTypes.SELECT,
    },
  ).then(result => result[0].count > 0);

model.productsForMainScene = async () => {
  const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
  const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');

  const productOrderedAtMonth = await sequelize
    .query(
      `SELECT prod.product_id, prod.name, prod.description, prod.price, prod.discounted_price,
      CONCAT(${domain}, '', prod.image) image, CONCAT(${domain}, '', prod.image_2) image_2,
      CONCAT(${domain}, '', prod.thumbnail) thumbnail
      FROM orders ord
      LEFT JOIN order_detail ordD ON ordD.order_id = ord.order_id
      LEFT JOIN product prod ON prod.product_id = ordD.product_id
      WHERE prod.display > 0 AND ord.created_on BETWEEN :startOfMonth AND :endOfMonth
      LIMIT 9`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { startOfMonth, endOfMonth },
      },
    );

  if (productOrderedAtMonth.length >= 9) {
    return productOrderedAtMonth;
  }

  const diff = 9 - productOrderedAtMonth.length;

  const products = await sequelize
    .query(
      `SELECT prod.product_id, prod.name, prod.description, prod.price, prod.discounted_price,
      CONCAT(${domain}, '', prod.image) image, CONCAT(${domain}, '', prod.image_2) image_2,
      CONCAT(${domain}, '', prod.thumbnail) thumbnail
      FROM product prod
      WHERE prod.display > 0
      ORDER BY RAND()
      LIMIT ${diff}`,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

  const productsToReturn = [...productOrderedAtMonth, ...products];

  return productsToReturn;
};

const foundRows = () => sequelize
  .query('SELECT FOUND_ROWS() total', { type: sequelize.QueryTypes.SELECT });

model.searchByName = (name, page) => {
  const offset = (page - 1) * 10;
  return sequelize
    .query(
      `SELECT SQL_CALC_FOUND_ROWS prod.product_id, prod.name, prod.description, prod.price, prod.discounted_price,
      CONCAT(${domain}, '', prod.image) image, CONCAT(${domain}, '', prod.image_2) image_2,
      CONCAT(${domain}, '', prod.thumbnail) thumbnail
      FROM product prod
      WHERE ${name ? `(prod.name LIKE '%${name}%' OR prod.description LIKE '%${name}%')` : ''}
      LIMIT 10 OFFSET :offset`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { name, offset },
      },
    ).then(async (rows) => {
      const total = await foundRows();
      const elements = total[0].total;
      let totalPages = Math.ceil(elements / 10);

      totalPages = (totalPages === 0 ? 1 : totalPages);

      return { rows, page, totalPages };
    });
};

module.exports = model;
