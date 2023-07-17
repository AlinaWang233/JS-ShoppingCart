if(process.env.NODE_ENV != 'production'){
    require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET
const stripePublicKey = process.env.STRIPE_PUBLIC

//create express server
const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

//set the view engine and provide front-end files
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))

app.get('/store', function(req, res){
    fs.readFile('items.json', function(error, data){
        if(error)
            res.status(500).end()
        else{
            res.render('store.ejs', {
                stripePublicKey: stripePublicKey,
                items: JSON.parse(data)
            })
        }
    })
})

app.post('/purchase', function(req, res){
    fs.readFile('items.json', function(error, data){
        if(error)
            res.status(500).end()
        else{
            const itemsJSON = JSON.parse(data)
            const itemsCollection = itemsJSON.music.concat(itemsJSON.merch)
            //console.log(itemsCollection)
            let total = 0
            req.body.items.forEach(function(item){
                const itemJSON = itemsCollection.find(function(i){
                    return i.id == item.id
                })
                //console.log(itemJSON)
                total = total + itemJSON.price * item.quantity
            })

            stripe.charges.create({
                amount: total,
                source: req.body.stripeTokenId,
                currency: 'usd'
            }).then(function(){
                console.log('Charge Successful')
                res.json({ message: 'Successfully purchased items' })
            }).catch(function(){
                console.log('Charge Fail')
                res.status(500).end()
            })
        }
    })

})

//server listen on port
app.listen(3000)