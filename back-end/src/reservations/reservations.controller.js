/**
 * List handler for reservation resources
 */
const service = require("./reservations.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

async function list(req, res) {
  const query = req.query.date;
  const data = query ? await service.listDate(query) : await service.list();
  res.json({
    data,
  });
}
async function create(req, res) {
  const data = await service.create(req.body.data);
  res.status(201).json({ data });
}

function isNumber(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    const isNumber = data[propertyName].replace(/-/g, "");
    if (Number(isNumber)) {
      return next();
    }
    next({ status: 400, message: `${propertyName}` });
  };
}

function isTime(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    const isTime = data[propertyName].replace(/:/g, "");
    if (Number(isTime)) {
      return next();
    }
    next({ status: 400, message: `${propertyName}` });
  };
}

function isPeopleNumber(req, res, next) {
  const { data = {} } = req.body;
  if (Number.isInteger(data.people)) {
    return next();
  }
  next({ status: 400, message: `people is not a number` });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `${propertyName}` });
  };
}

function isTuesday(req, res, next) {
  const { data = {} } = req.body; // gets the body of data from the JSON
  const day = new Date(data.reservation_date);
  const dayOf = day.getUTCDay();
  if (dayOf === 2) {
    return next({ status: 400, message: `closed` });
  }
  next();
}

function isFutureRes(req, res, next) {
  const { data = {} } = req.body;
  const day = new Date(`${data.reservation_date} ${data.reservation_time}`);
  const today = new Date(); // empty argument = current
  if (day < today) {
    return next({ status: 400, message: "Needs to be future date" });
  }
  return next();
}

function openHours(req, res, next) {
  const { data = {} } = req.body;
  const time = data.reservation_time;
  const currentTime = new Date();
  if (currentTime < time) {
    return next({
      status: 400,
      message: `please make reservation for a time after current time`,
    });
  }
  if (time < "10:30" || time > "20:30") {
    return next({
      status: 400,
      message: `Hours of operation are between 10:30AM to 09:30PM, latest reservations 1 hour before closing`,
    });
  }
  return next();
}

module.exports = {
  list: [asyncErrorBoundary(list)],
  post: [
    bodyDataHas("first_name"),
    bodyDataHas("last_name"),
    bodyDataHas("mobile_number"),
    bodyDataHas("reservation_date"),
    isTuesday,
    isFutureRes,
    bodyDataHas("reservation_time"),
    bodyDataHas("people"),
    isNumber("reservation_date"),
    isTime("reservation_time"),
    isPeopleNumber,
    openHours,
    asyncErrorBoundary(create),
  ],
};
