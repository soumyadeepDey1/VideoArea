class ApiError extends Error {
  constructor(message="Something went wrong", statusCode,errors=[],statck="") {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.message = message;
    this.success = false;
    this.data= null;

    if (statck) {
       this.statck = statck; 
    }else{
        Error.captureStackTrace(this, this.constructor);
    }
  }
}

export {ApiError}