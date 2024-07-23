//higher order function
//takes function as an argument and also return function as an argument
const asyncHnadler=(requestHandler)=>{
   return (req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next))
    .catch((err)=>{next(err)});
   }
}


// const asyncHandler=(fn)=>async(req,res,next)=>{
//       try {
//         await fn(req,res,next)
//       } catch (error) {
//         res.status(500).json({
//             success:false,
//             message:error.message
//         })
//       }
// }