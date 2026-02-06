const autoTaskRoutes = require('./routes/api/autoTask');
const socialMediaRoutes = require('./routes/api/socialMedia');
const aiMarketingRoutes = require('./routes/api/aiMarketing');
const aiPersonaRoutes = require('./routes/api/aiPersona');
const uploadRoutes = require('./routes/api/upload');
// Main Express server for tax software backend APIs
// Start AI Marketing Scheduler
require('./aiMarketingScheduler');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();


const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Register API routes after app is initialized



const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const workflowRoutes = require('./routes/workflow');
const refundRoutes = require('./routes/refund');
const bankProductRoutes = require('./routes/bankProduct');
// New API routes
const clientRoutes = require('./routes/api/clients');
const returnRoutes = require('./routes/api/returns');
const chatRoutes = require('./routes/api/chat');
const workflowAIRoutes = require('./routes/api/workflowAI');
const complianceLogRoutes = require('./routes/api/complianceLogs');



// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rosstaxprep';
mongoose.connect(mongoUri)
	.then(() => console.log('MongoDB connected'))
	.catch(err => console.error('MongoDB connection error:', err));


app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/refund', refundRoutes);
app.use('/api/bank-product', bankProductRoutes);
// New API endpoints
app.use('/api/clients', clientRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/workflow-ai', workflowAIRoutes);
app.use('/api/compliance-logs', complianceLogRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend API running on port ${PORT}`));
