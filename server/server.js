const express= require('express')
const Sequelize = require('sequelize')
const bodyParser = require('body-parser')
const cors=require('cors')

const sequelize = new Sequelize({
    dialect: 'sqlite', storage:"sample.db", define: {timestamps:false}
})

const Spacecraft = sequelize.define('spacecraft',{
    name: {type: Sequelize.STRING},
    maxSpeed:{type: Sequelize.INTEGER},
    mass:{type: Sequelize.INTEGER}
})

const Astronaut = sequelize.define('astronaut',{
    name: {type: Sequelize.STRING},
    role: {type: Sequelize.STRING}
})

Spacecraft.hasMany(Astronaut)

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.get('/sync', async(req,res) =>{
    try{
        await sequelize.sync({force:true})
        res.status(201).json({message:"The tables have been created"})
    } catch(err) {
        console.warn(err)
        res.status(500).json({message:'An error occured'})
    }
})

app.get('/spacecrafts', async(req,res) => {
    try{
        const spacecrafts = await Spacecraft.findAll({
            include : Astronaut
        })
        res.status(200).json(spacecrafts)
    } catch(err) {
        console.warn(err)
        res.status(500).json({message:'An error occured'})
    }
})

app.post('/spacecrafts', async(req,res) => {
    try{
        const spacecraft= req.body

        if(spacecraft.name.length < 3 || spacecraft.maxSpeed <= 1000 || spacecraft.mass <= 200)
            throw "One of the values doesnt meet the criteria";

        await Spacecraft.create(spacecraft)
        
        res.status(201).json({message: 'Spacecraft created'})
    } catch(err) {
        console.warn(err)
        res.status(500).json({message:'An error occured'})
    }
})

app.get('/spacecrafts/:sid', async(req,res) => {
    try{
        const spacecraft = await Spacecraft.findByPk(req.params.sid,{
            include: Astronaut
        })
        if(spacecraft){
            res.status(200).json(spacecraft)
            
        } else{
            res.status(404).json({message:"Spacecraft not found"})
        }
    } catch(err) {
        console.warn(err)
        res.status(500).json({message:'An error occured'})
    }
})

app.put('/spacecrafts/:sid', async(req,res) => {
    try{
        const spacecraft = await Spacecraft.findByPk(req.params.sid)
        if(spacecraft){

            if(req.body.name.length < 3 || req.body.maxSpeed <= 1000 || req.body.mass <= 200)
            throw "One of the values doesnt meet the criteria";

            await spacecraft.update(req.body,{ fields: ['name','maxSpeed','mass']})
            res.status(202).json({message : "Put accepted"})

        } else{
            res.status(404).json({message:"Not found"})
        }
    } catch(err) {
        console.warn(err)
        res.status(500).json({message:'An error occured'})
    }
})

app.delete('/spacecrafts/:sid', async(req,res) => {
    try{
        const spacecraft = await Spacecraft.findByPk(req.params.sid)
        if(spacecraft){
            await spacecraft.destroy()
            res.status(202).json({message : "Accepted"})

        } else{
            res.status(404).json({message:"Not found"})
        }
    } catch(err) {
        console.warn(err)
        res.status(500).json({message:'An error occured'})
    }
})

app.get('/spacecrafts/:sid/astronauts',async (req,res) => {
    try{
        const spacecraft = await Spacecraft.findByPk(req.params.sid)
        if(spacecraft){
            const astronauts=await spacecraft.getAstronauts()
            res.status(200).json(astronauts)
        } else{
            res.status(404).json({message:"Astronauts not found"})
        }
    } catch(err) {
        console.warn(err)
        res.status(500).json({message:'An error occured'})
    }
})


app.post('/spacecrafts/:sid/astronauts',async (req,res) => {
    try{
        const spacecraft = await Spacecraft.findByPk(req.params.sid)
        if(spacecraft){
            roles = ["COMMANDER", "PILOT"];
            const astronaut = req.body
            console.log(astronaut)
            if(!roles.includes(astronaut.role) || astronaut.name.length < 5)
            throw "Criteria not met";
            astronaut.spacecraftId = spacecraft.id
            await Astronaut.create(astronaut)
            res.status(200).json({message: 'Astronaut created'})
        } else{
            res.status(404).json({message:"Not found"})
        }
    } catch(err) {
        console.warn(err)
        res.status(500).json({message:'An error occured'})
    }
})

app.get('/spacecrafts/:sid/astronauts/:aid',async (req,res) => {
    try{
        const spacecraft = await Spacecraft.findByPk(req.params.sid)
        if(spacecraft){
            const astronaut = await Astronaut.findByPk(req.params.aid)
            if(astronaut){
                res.status(200).json(astronaut)
            } else{
                res.status(404).json({message:"Astronaut not found"})
            }
        } else{
            res.status(404).json({message:"Spaceship not found"})
        }
    } catch(err) {
        console.warn(err)
        res.status(500).json({message:'An error occured'})
    }
})

app.put('/spacecrafts/:sid/astronauts/:aid',async (req,res) => {
    try{
        const spacecraft = await Spacecraft.findByPk(req.params.sid)
        if(spacecraft){
            const astronauts= await spacecraft.getAstronauts({where: {
                id:req.params.aid
            }})
            roles = ["COMMANDER", "PILOT"];
            if(!roles.includes(req.body.role) || req.body.name.length < 5)
            throw "Criteria now met"
            const astronaut= astronauts.shift()
            if(astronaut){
                await astronaut.update(req.body)
                res.status(202).json({message : "Put Astronaut Accepted"})
            } else{
                res.status(404).json({message:"Astronaut not found"})
            }
        } else{
            res.status(404).json({message:"Spacecraft not found"})
        }
    } catch(err) {
        console.warn(err)
        res.status(500).json({message:'AN error occured'})
    }
})

app.delete('/spacecrafts/:sid/astronauts/:aid',async (req,res) => {
    try{
        const spacecraft = await Spacecraft.findByPk(req.params.sid)
        if(spacecraft){
            const astronauts= await spacecraft.getAstronauts({where: {
                id:req.params.aid
            }})
            const astronaut = astronauts.shift()
            if(astronaut){
                await astronaut.destroy()
                res.status(202).json({message : "Delete accepted"})
            } else{
                res.status(404).json({message:"Astronaut not found"})
            }
        } else{
            res.status(404).json({message:"Spacecraft not found"})
        }
    } catch(err) {
        console.warn(err)
        res.status(500).json({message:'An error occured'})
    }
})

//PAGINATION
app.get("/spacecraftsPagination", async (req, res) => {
    try {
      let countPagination = 0;
      Spacecraft.findAndCountAll({  
        limit: 1,
        offset: countPagination,
      }).then(function (result) {
        res.status(202).json(result.rows);
        countPagination += limit;
      });
    } catch (err) {
      console.warn(err);
      res.status(500).json({ message: "An error occured" });
    }
  });

app.listen(8080)

