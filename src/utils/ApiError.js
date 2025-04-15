class ApiError extends Error {
  constructor(message="Something went wrong", statusCode,errors=[],stack="") {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.message = message;
    this.success = false;
    this.data= null;

    if (stack) {
       this.stack = stack; 
    }else{
        Error.captureStackTrace(this, this.constructor);
    }
  }
}

export {ApiError}