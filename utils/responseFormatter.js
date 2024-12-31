// utils/responseFormatter.js

const formatSuccessResponse = (data, message) => {
  // Check if data is an object or array, otherwise return data as is
  const transformData = (inputData) => {
    if (Array.isArray(inputData)) {
      return inputData.map(item => {
        const { _id,  __v, updatedAt, ...rest } = item.toObject
          ? item.toObject()
          : item;
        return rest;
      });
    } else if (inputData && typeof inputData === 'object') {
      const { _id, __v, updatedAt, ...rest } = inputData.toObject
        ? inputData.toObject()
        : inputData;
      return rest;
    } else {
      // Return the data as is if it's not an object or array
      return inputData;
    }
  };

  const transformedData = transformData(data);

  return {
    success: true,
    message: message || 'Operation completed successfully',
    data: transformedData,
  };
};

const formatErrorResponse = (message, data = null) => {
  return {
    success: false,
    message: message || 'An error occurred',
    data,
  };
};

module.exports = {
  formatSuccessResponse,
  formatErrorResponse,
};
