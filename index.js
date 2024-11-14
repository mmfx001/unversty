// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// MongoDB URI
const uri = 'mongodb+srv://dilbekshermatov:dilbek1233@cluster0.fd3n7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Define the schemas
const userSchema = new Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    university_id: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    img: { type: String },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    role: { type: String, required: true },
    tokens: [{
        reason: String,
        quantity: Number,
        event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoEvent' },
        time: { type: Date, default: Date.now }
    }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
});

const facultySchema = new Schema({
    faculty_name: { type: String, required: true }
});

const productSchema = new Schema({
    name: { type: String, required: true },
    img: { type: String },
    cost: { type: Number, required: true },
    quantity: { type: Number, required: true }
});

const shopHistorySchema = new Schema({
    shop_code: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    time: { type: Date, default: Date.now },
    status: { type: String, required: true }
});

const clubAccountSchema = new Schema({
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    leader: { type: String, required: true },
    login: { type: String, required: true },
    password: { type: String, required: true },
    logo: { type: String }
});

const categorySchema = new Schema({
    name: { type: String, required: true }
});

const postSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    datetime: { type: Date, default: Date.now },
    image: { type: String },
    club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClubAccount' },
    likes: { type: Number, default: 0 }
});

const commentSchema = new Schema({
    text: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    time: { type: Date, default: Date.now }
});

const postImageSchema = new Schema({
    image: { type: String },
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    order: { type: Number }
});

const clubEventSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    img: { type: String },
    url: { type: String },
    is_active: { type: Boolean, default: true },
    deadline: { type: Date },
    club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClubAccount' }
});

const promoEventSchema = new Schema({
    promo: { type: String, required: true },
    quantity_token: { type: Number, required: true },
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClubEvent' }
});

const clubMemberSchema = new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClubAccount' },
    time: { type: Date, default: Date.now }
});

// Export Models (Corrected export syntax)
const Faculty = mongoose.model('Faculty', facultySchema);
const Product = mongoose.model('Product', productSchema);
const ShopHistory = mongoose.model('ShopHistory', shopHistorySchema);
const ClubAccount = mongoose.model('ClubAccount', clubAccountSchema);
const Category = mongoose.model('Category', categorySchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const PostImage = mongoose.model('PostImage', postImageSchema);
const ClubEvent = mongoose.model('ClubEvent', clubEventSchema);
const PromoEvent = mongoose.model('PromoEvent', promoEventSchema);
const ClubMember = mongoose.model('ClubMember', clubMemberSchema);
const User = mongoose.model('User', userSchema);

// Express app initialization
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Create CRUD routes for any model
const createCRUDRoutes = (model, modelName) => {
    const router = express.Router();

    // GET all items
    router.get('/', async (req, res) => {
        try {
            const items = await model.find();
            res.json(items);
        } catch (err) {
            console.error(`GET /${modelName.toLowerCase()} error:`, err.message);
            res.status(500).json({ message: err.message });
        }
    });

    // GET one item by ID
    router.get('/:id', getItem(model, modelName), (req, res) => {
        res.json(res.item);
    });

    // POST new item
    router.post('/', async (req, res) => {
        console.log(`POST /${modelName.toLowerCase()}`);
        console.log('Request Body:', req.body);
        const item = new model(req.body);
        try {
            const newItem = await item.save();
            res.status(201).json(newItem);
        } catch (err) {
            console.error(`POST /${modelName.toLowerCase()} error:`, err.message);
            res.status(400).json({ message: err.message });
        }
    });

    // PUT update item
    router.put('/:id', getItem(model, modelName), async (req, res) => {
        Object.assign(res.item, req.body);
        try {
            const updatedItem = await res.item.save();
            res.json(updatedItem);
        } catch (err) {
            console.error(`PUT /${modelName.toLowerCase()}/${req.params.id} error:`, err.message);
            res.status(400).json({ message: err.message });
        }
    });

    // DELETE item
    router.delete('/:id', getItem(model, modelName), async (req, res) => {
        try {
            await res.item.remove();
            res.json({ message: `${modelName} deleted` });
        } catch (err) {
            console.error(`DELETE /${modelName.toLowerCase()}/${req.params.id} error:`, err.message);
            res.status(500).json({ message: err.message });
        }
    });

    return router;
};

// Middleware to get item by ID
function getItem(model, modelName) {
    return async (req, res, next) => {
        let item;
        try {
            item = await model.findOne({ _id: req.params.id });
            if (item == null) {
                return res.status(404).json({ message: `${modelName} not found` });
            }
        } catch (err) {
            console.error(`GET_ITEM /${modelName.toLowerCase()}/${req.params.id} error:`, err.message);
            return res.status(500).json({ message: err.message });
        }

        res.item = item;
        next();
    };
}

// Use routes for different models
app.use('/users', createCRUDRoutes(User, 'User'));
app.use('/faculties', createCRUDRoutes(Faculty, 'Faculty'));
app.use('/products', createCRUDRoutes(Product, 'Product'));
app.use('/shopHistories', createCRUDRoutes(ShopHistory, 'ShopHistory'));
app.use('/clubAccounts', createCRUDRoutes(ClubAccount, 'ClubAccount'));
app.use('/categories', createCRUDRoutes(Category, 'Category'));
app.use('/posts', createCRUDRoutes(Post, 'Post'));
app.use('/comments', createCRUDRoutes(Comment, 'Comment'));
app.use('/postImages', createCRUDRoutes(PostImage, 'PostImage'));
app.use('/clubEvents', createCRUDRoutes(ClubEvent, 'ClubEvent'));
app.use('/promoEvents', createCRUDRoutes(PromoEvent, 'PromoEvent'));
app.use('/clubMembers', createCRUDRoutes(ClubMember, 'ClubMember'));

// MongoDB connection
mongoose.connection.on('connected', () => {
    console.log('Mongoose: Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose: Connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose: Disconnected from MongoDB');
});

// MongoDB connection logic
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Start the Express server
const port = 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
