const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http,{
	cors: {
    origin: '*',
  }
});
const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT || 4001
const ObjectId = require('mongodb').ObjectId;
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.DATABASE_URI;
const client = new MongoClient(uri, { useUnifiedTopology: true });
var collection = "";
const main = async()=>{
connect = await client.connect();  
collection= connect.db().collection('addresses'); 
}
main();

io.on('connection',(socket)=>{
    socket.on('loadgames',async(account,callback)=>{
        try{
            account = account.toLowerCase();
            const res = await collection.find({ $or: [ { j2: account }, { j1: account } ] },{projection: { _id: 0}}).toArray();
            callback(res);
        }
        catch(error){
            callback({status:'error',message:'Network Error:Failed to retrieve contract addresses'});
        }
    });
    socket.on('addgame',async(values,callback)=>{
        try{
            values.j1 = values.j1.toLowerCase();
            values.j2 = values.j2.toLowerCase();
            const res = await collection.insertOne(values);
            callback({status:'success',message:'Contract address added successfully'});
        }
        catch(error){
            if(error.code === 11000)
                callback({status:'error',message:'Contract address already exists'});
            else
                callback({status:'error',message:'Network Error: Failed to add contract address to db'});
        }
    })
    socket.on('removegame',async(address,callback)=>{
        try{
            const res = await collection.deleteOne({address:address});
            callback({status:'success',message:'Contract address deleted successfully'});
        }
        catch(error){
            callback({status:'error',message:'Network Error:Failed to remove address from db'});
        }
    });
    socket.on('solved',async(address,move,winner,value,callback)=>{
        const query = {address}
        const values = {$set:{move,winner,value}}
        try{
            const res = await collection.updateOne(query,values);
            callback({status:'success',message:`Game at ${address} resolved successfully`});
        }catch(error){
            callback({status:'error',message:'Network Error:Failed to update'});
        }

    });
})



http.listen(port,()=>{
    console.log("Server listening on port " + port);
})