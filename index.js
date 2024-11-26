// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
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
    faculty: { type: String },
    role: { type: String, required: true },
    tokens: [{
        reason: String,
        quantity: Number,
        event_id: { type: String },
        time: { type: String }
    }],
    likeItems: [String]

});

const facultySchema = new Schema({
    faculty_name: { type: String, required: true }
});

const purchaseSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    cost: { type: Number, required: true },
    purchaseDate: { type: Date, default: Date.now },
    productImg: { type: String },
    status: { type: String, enum: ['ожидает выдачи', 'получено', 'отменен'], default: 'ожидает выдачи' }
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
    category: { type: String },
    leader: { type: String, required: true },
    login: { type: String, required: true },
    password: { type: String, required: true },
    logo: { type: String },
    description: { type: String },
    followers: { type: String }
});

const categorySchema = new Schema({
    name: { type: String, required: true }
});

const postSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    datetime: { type: String },
    image: { type: String },
    club_id: { type: String },
    likes: { type: Number, default: 0 }
});

const commentSchema = new Schema({
    text: { type: String, required: true },
    user_id: { type: String },
    post_id: { type: String },
    time: { type: String }
});

const newsSchema = new Schema({
    url: { type: String, required: true },
 
});
const registerSchema = new Schema({

    userid: { type: String, required: true },
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

// Export Models
const Faculty = mongoose.model('Faculty', facultySchema);
const News = mongoose.model('News', newsSchema);
const Register = mongoose.model('Register', registerSchema);
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
const Purchase = mongoose.model('Purchase', purchaseSchema);

// Express app initialization
const app = express();
app.use(express.json());
app.use(cors());
// Добавим новый маршрут для отмены покупки
app.put('/purchases/:id/cancel', getItem(Purchase, 'Purchase'), async (req, res) => {
    try {
        // Change the purchase status to 'отменен'
        res.item.status = 'отменен';

        // Save the changes to the database without deleting the history
        const updatedItem = await res.item.save();

        // Optionally: Update the product quantity or user tokens if necessary (like in your original logic)
        const product = await Product.findById(res.item.productId);
        if (product) {
            // Increase the product quantity by 1 (assuming cancellation means return)
            product.quantity += 1;
            await product.save();
        }

        const user = await User.findById(res.item.userId);
        if (user && res.item.cost) {
            // Refund tokens to the user
            user.tokens[0].quantity += res.item.cost; // Assuming the cost is in tokens, adjust if necessary
            await user.save();
        }

        // Respond with the updated purchase item
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Create CRUD routes for any model
const createCRUDRoutes = (model, modelName) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const items = await model.find();
            res.json(items);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    router.get('/:id', getItem(model, modelName), (req, res) => {
        res.json(res.item);
    });

    router.post('/', async (req, res) => {
        const item = new model(req.body);
        try {
            const newItem = await item.save();
            res.status(201).json(newItem);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    router.put('/:id', getItem(model, modelName), async (req, res) => {
        Object.assign(res.item, req.body);
        try {
            const updatedItem = await res.item.save();
            res.json(updatedItem);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    router.delete('/:id', getItem(model, modelName), async (req, res) => {
        try {
            await res.item.remove();
            res.json({ message: `${modelName} deleted` });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    return router;
};



function getItem(model, modelName) {
    return async (req, res, next) => {
        let item;
        try {
            item = await model.findOne({ _id: req.params.id });
            if (item == null) {
                return res.status(404).json({ message: `${modelName} not found` });
            }
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
        res.item = item;
        next();
    };
}

// Use routes for different models
app.use('/purchases', createCRUDRoutes(Purchase, 'Purchase'));
app.use('/users', createCRUDRoutes(User, 'User'));
app.use('/register', createCRUDRoutes(Register, 'Register'));
app.use('/news', createCRUDRoutes(News, 'News'));
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
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from MongoDB');
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});