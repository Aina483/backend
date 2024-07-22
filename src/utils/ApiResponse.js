class ApiResponse{
    constructor(statusCode, message="success" , data){
         this.stausCde=statusCode;
         this.data=data;
         this.message=message;
         this.success=statusCode<400;
    }
}