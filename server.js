var express = require('express');
var app = express();

var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var handlebars = require('express-handlebars');
var bcrypt = require('bcryptjs');

// requires files defining content schema
var Contact = require('./models/Contact');
var User = require ('./models/User');


app.set('view engine', 'hbs');

app.engine('hbs', handlebars({
    layoutsDir: __dirname + '/views/layouts',
    extname: 'hbs'
}))

//linking to public folder
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//this sets inital landing page is defult page -> '/' is the default location
app.get('/', (req, res) =>{
    res.render('login', {layout: 'main' });
})

//web application getting something from the server
//req = request //res = response //=>'fat arrow' = function
app.get('/dashboard', (req, res) => {
    Contact.find({}).lean()
    .exec((err, contacts) =>{
        if(contacts.length){
            res.render('dashboard', { layout: 'main', contacts: contacts, contactsExist: true });
        } else{
            res.render('dashboard', { layout: 'main', contacts: contacts, contactsExist: false });
        }  
    });
});

//async function used here (for security)
//prevents a user making 2 accounts with the same email
// sending username and password to database
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        //checks if email already exisits
        let user = await User.findOne({ username });

        if(user) {
            //if it does, gives feedback and doesnt send to database
            //400 = bad request - user aleardy exists
            return res.status(400).render('login', {layout: 'main', userExist: true});
        }
        user = new User({
            username,
            password
        });
        //salt is a type of encryption that adds characters to the end of a password
        const salt = await bcrypt.genSalt(10);
        //encrypting the password
        user.password = await bcrypt.hash(password, salt);
    
        await user.save();
        // prevent hanging, redirect back to home page
        res.status(200).render('login', {layout: 'main', userDoesNotExist: true});
    } catch(err){
        //if theres an error, stop the code and feedback to client
        console.log(err.message);
        res.status(500).send('Server Error')
    }
})



// adding a contact
app.post('/addContact', (req, res) =>{
    const { name, email, number} = req.body;
    var contact = new Contact({
        name,
        email,
        number
    });

    contact.save();
    // prevent hanging, redirect back to home page
    res.redirect('/');
})


mongoose.connect('mongodb://localhost:27017/handlebars', {
    useUnifiedTopology: true,
    useNewUrlParser: true
})
.then(() => {
    console.log('Connected to the DB :)');
})
.catch((err) => {
    console.log('Not connected to the DB with err: ' + err);
});


//listening for requests on port 3000
app.listen(3000,() => {
    console.log(' Server listening on port 3000 :) ');
});