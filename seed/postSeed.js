const dns=require("dns")
dns.setServers([
  "10.81.128.153"
]);


// const mongoose = require("mongoose");
// const { postModel } = require("../src/models/post.model");

// require("dotenv").config()
// const USER_1 = "6a90fb346259ef89ec75b2fc";
// const USER_2 = "6a906a0e6259ef89ec75b2fa";

// const imageUrls = [
//     "https://res.cloudinary.com/dxs6wbjoa/image/upload/v1788792028/gqs61b537wmrktprswlg.jpg",
//     "https://res.cloudinary.com/dxs6wbjoa/image/upload/v1788792160/xqfjh3p3i30g7obopwmz.jpg",
//     "https://res.cloudinary.com/dxs6wbjoa/image/upload/v1788794689/qug1vejb7ix1quvpno11.jpg"
// ];

// const videoUrls = [
//     "https://res.cloudinary.com/dxs6wbjoa/video/upload/v1788796726/rhdpe89nrppes4zlfocz.mp4",
//     "https://res.cloudinary.com/dxs6wbjoa/video/upload/v1788796951/xgpksvtjxyp737uewl5d.mp4"
// ];

// const thoughts = [
//     "Believe in yourself and keep moving forward.",
//     "Small steps every day lead to big results.",
//     "Every day is a new opportunity.",
//     "Stay positive and keep growing.",
//     "Focus on progress, not perfection.",
//     "Good things take time.",
//     "Keep working on your dreams.",
//     "Make today count.",
//     "Never stop learning.",
//     "Consistency is the key to success.",
//     "Be better than yesterday.",
//     "Enjoy the journey.",
//     "Stay focused on your goals.",
//     "Dream big and work hard.",
//     "Positive thoughts create positive actions.",
//     "Keep pushing forward.",
//     "Learn, grow and improve.",
//     "Your future starts today.",
//     "Stay patient and trust the process.",
//     "Never give up on yourself."
// ];

// const createPosts = (authorId) => {

//     const posts = [];

//     // 20 THOUGHT POSTS
//     for (let i = 0; i < 20; i++) {
//         posts.push({
//             content: thoughts[i],
//             imgUrl: "",
//             authorId
//         });
//     }

//     // 20 IMAGE POSTS
//     for (let i = 0; i < 20; i++) {
//         posts.push({
//             content: `Amazing moment ${i + 1}`,
//             imgUrl: imageUrls[i % imageUrls.length],
//             authorId
//         });
//     }

//     // 20 VIDEO POSTS
//     for (let i = 0; i < 20; i++) {
//         posts.push({
//             content: `Watch this video ${i + 1}`,
//             imgUrl: videoUrls[i % videoUrls.length],
//             authorId
//         });
//     }

//     return posts;
// };

// const seedPosts = async () => {

//     try {

//         await mongoose.connect(process.env.MONGO_URL);

//         console.log("MongoDB connected");

//         const posts = [
//             ...createPosts(USER_1),
//             ...createPosts(USER_2)
//         ];

//         await postModel.insertMany(posts);

//         console.log("✅ Posts inserted:", posts.length);
//         console.log("User 1:", 60);
//         console.log("User 2:", 60);

//         await mongoose.connection.close();

//         console.log("MongoDB connection closed");

//     } catch (error) {

//         console.error("❌ Error:", error);

//         process.exit(1);
//     }
// };

// seedPosts();





const mongoose = require("mongoose");
const { postModel } = require("../src/models/post.model");
const { commentModel } = require("../src/models/comment.model");
require("dotenv").config()

const USER_1 = "6a90fb346259ef89ec75b2fc";
const USER_2 = "6a906a0e6259ef89ec75b2fa";

const commentTexts = [
  "Nice post!",
  "Amazing!",
  "Love this!",
  "Great thought.",
  "Well said.",
  "Awesome!",
  "Keep posting.",
  "Very inspiring.",
  "Interesting perspective.",
  "Totally agree.",
  "🔥🔥🔥",
  "Wonderful!",
  "This is helpful.",
  "Excellent post.",
  "Good one!"
];

async function seedComments() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("✅ MongoDB Connected");

    const posts = await postModel.find({}, "_id");

    const comments = [];

    for (const post of posts) {
      // Comment from User 1
      comments.push({
        post: post._id,
        user: USER_1,
        content:
          commentTexts[Math.floor(Math.random() * commentTexts.length)]
      });

      // Comment from User 2
      comments.push({
        post: post._id,
        user: USER_2,
        content:
          commentTexts[Math.floor(Math.random() * commentTexts.length)]
      });
    }

    await commentModel.insertMany(comments);

    console.log(`✅ ${comments.length} comments inserted`);

    // Update commentsCount for every post
    await postModel.updateMany(
      {},
      {
        $set: {
          commentsCount: 2
        }
      }
    );

    console.log("✅ commentsCount updated to 2 for all posts");

    await mongoose.connection.close();

    console.log("✅ Done");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

seedComments();