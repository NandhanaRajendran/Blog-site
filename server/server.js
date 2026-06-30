const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes')


dotenv.config();

connectDB();


const app = express();

const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use('/api',userRoutes);
app.use('/uploads',express.static(`${__dirname}/uploads`))
app.use("/api/admin", userRoutes);


app.get('/',(req,res)=> {
    res.send('Server is running...')
})


app.listen(PORT,()=> {
    console.log(`Server is running on PORT: ${PORT}`);
    
})
