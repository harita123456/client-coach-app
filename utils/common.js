// Success Response
const successResponse = (
  res,
  { statusCode = 200, message = "Success", data = {} }
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Error Response
const errorResponse = (
  res,
  { statusCode = 500, message = "Internal Server Error", error = null }
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ? error.message : null,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
