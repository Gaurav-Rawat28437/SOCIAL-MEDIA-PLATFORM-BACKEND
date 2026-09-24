const express = require("express")
const { postModel } = require("../models/post.model")
const router = express.Router()
const { likeModel } = require("../models/like.model")
const { userModel } = require("../models/User.model")

router.post("/create", async (req, res) => {
    try {
        const { content, imgUrl } = req.body

        const foundUser = req.foundUser

        if (!content?.trim() && !imgUrl) {
            throw new Error("Post must have content or image")
        }

        const createdPost = await postModel.create({
            authorId: foundUser._id,
            content: content?.trim(),
            imgUrl
        }).populate(
            "authorId",
            "firstName lastName username displayPicture"
        )

        if (imgUrl) {
            await userModel.findByIdAndUpdate(foundUser._id, {
                $inc: {
                    postCount: 1
                }
            })
        }
        else {
            await userModel.findByIdAndUpdate(foundUser._id, {
                $inc: {
                    thoughtCount: 1
                }
            })
        }



        res.status(201).json({
            success: true,
            msg: createdPost.imgUrl ? "Post uploaded successfully" : "Thought uploaded successfully",
            data: createdPost
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            msg: error.message
        })
    }
})

router.get("/my-posts", async (req, res) => {

    try {

        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 18)

        const skip = (page - 1) * limit

        const posts = await postModel
            .find({
                authorId: req.foundUser._id,
                imgUrl: { $ne: "" }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit + 1)

        const hasMore = posts.length > limit

        if (hasMore) {
            posts.pop()
        }

        const postsWithLike = await Promise.all(
            posts.map(async (post) => {

                const like = await likeModel.findOne({
                    user: req.foundUser._id,
                    post: post._id
                })

                return {
                    ...post.toObject(),
                    isLiked: !!like
                }
            })
        )

        res.status(200).json({
            success: true,
            data: postsWithLike,
            hasMore
        })

    } catch (error) {

        res.status(400).json({
            success: false,
            msg: error.message
        })

    }
})

router.delete("/delete/:postId", async (req, res) => {
    try {

        const { postId } = req.params
        const foundUser = req.foundUser

        const deletedPost = await postModel.findOneAndDelete({
            _id: postId,
            authorId: foundUser._id
        })

        if (!deletedPost) {
            return res.status(404).json({
                success: false,
                msg: "Post not found"
            })
        }

        if (deletedPost.imgUrl) {
            await userModel.findByIdAndUpdate(foundUser._id, {
                $inc: {
                    postCount: -1
                }
            }
            )
        }
        else {
            await userModel.findByIdAndUpdate(foundUser._id, {
                $inc: {
                    thoughtCount: -1
                }
            }
            )
        }




        res.status(200).json({
            success: true,
            msg: deletedPost.imgUrl ? "Post deleted successfully" : "Thought deleted successfully"
        })

    } catch (error) {

        res.status(400).json({
            success: false,
            msg: error.message
        })

    }
})

router.patch("/edit/:postId", async (req, res) => {
    try {

        const { postId } = req.params
        const foundUser = req.foundUser
        const { content } = req.body

        const updatedPost = await postModel.findOneAndUpdate(
            {
                _id: postId,
                authorId: foundUser._id
            },
            {
                content: content?.trim() || ""
            },
            {
                new: true
            }
        )

        if (!updatedPost) {
            return res.status(404).json({
                success: false,
                msg: "Post not found"
            })
        }

        res.status(200).json({
            success: true,
            msg: updatedPost.imgUrl ? "Post updated successfully" : "Thought updated successfully",
            data: updatedPost
        })

    } catch (error) {

        res.status(400).json({
            success: false,
            msg: error.message
        })

    }
})

router.get("/my-thoughts", async (req, res) => {

    try {

        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 18)

        const skip = (page - 1) * limit

        const thoughts = await postModel
            .find({
                authorId: req.foundUser._id,
                imgUrl: ""
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit + 1)

        const hasMore = thoughts.length > limit

        if (hasMore) {
            thoughts.pop()
        }

        const thoughtsWithLike = await Promise.all(
            thoughts.map(async (thought) => {

                const like = await likeModel.findOne({
                    user: req.foundUser._id,
                    post: thought._id
                })

                return {
                    ...thought.toObject(),
                    isLiked: !!like
                }
            })
        )

        res.status(200).json({
            success: true,
            data: thoughtsWithLike,
            hasMore
        })

    } catch (error) {

        res.status(400).json({
            success: false,
            msg: error.message
        })

    }
})

router.get("/feed", async (req, res) => {

    try {

        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 18)

        const skip = (page - 1) * limit

        const totalPosts = await postModel.countDocuments()

        const posts = await postModel
            .find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate(
                "authorId",
                "firstName lastName username displayPicture"
            )

        const postsWithLike = await Promise.all(
            posts.map(async (post) => {

                const like = await likeModel.findOne({
                    user: req.foundUser._id,
                    post: post._id
                })

                return {
                    ...post.toObject(),
                    isLiked: !!like
                }
            })
        )

        const hasMore = skip + posts.length < totalPosts

        res.status(200).json({
            success: true,
            data: postsWithLike,
            hasMore
        })

    } catch (error) {

        res.status(400).json({
            success: false,
            msg: error.message
        })

    }
})

router.get("/:postId", async (req, res) => {

    try {

        const { postId } = req.params

        const post = await postModel
            .findById(postId)
            .populate(
                "authorId",
                "firstName lastName username displayPicture"
            )

        if (!post) {
            return res.status(404).json({
                success: false,
                msg: "Post not found"
            })
        }

        const like = await likeModel.findOne({
            user: req.foundUser._id,
            post: post._id
        })

        const postData = {
            ...post.toObject(),
            isLiked: !!like
        }

        res.status(200).json({
            success: true,
            data: postData
        })

    } catch (error) {

        res.status(400).json({
            success: false,
            msg: error.message
        })

    }
})


router.get("/user/:userId/posts", async (req, res) => {
    try {

        const { userId } = req.params

        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 18)

        const skip = (page - 1) * limit

        const posts = await postModel
            .find({
                authorId: userId,
                imgUrl: { $ne: "" }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit + 1)

        const hasMore = posts.length > limit

        if (hasMore) {
            posts.pop()
        }

        const postsWithLike = await Promise.all(
            posts.map(async (post) => {

                const like = await likeModel.findOne({
                    user: req.foundUser._id,
                    post: post._id
                })

                return {
                    ...post.toObject(),
                    isLiked: !!like
                }
            })
        )

        res.status(200).json({
            success: true,
            data: postsWithLike,
            hasMore
        })

    } catch (error) {

        res.status(400).json({
            success: false,
            msg: error.message
        })

    }
})


router.get("/user/:userId/thoughts", async (req, res) => {
    try {

        const { userId } = req.params

        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 18)

        const skip = (page - 1) * limit

        const thoughts = await postModel
            .find({
                authorId: userId,
                imgUrl: ""
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit + 1)

        const hasMore = thoughts.length > limit

        if (hasMore) {
            thoughts.pop()
        }

        const thoughtsWithLike = await Promise.all(
            thoughts.map(async (thought) => {

                const like = await likeModel.findOne({
                    user: req.foundUser._id,
                    post: thought._id
                })

                return {
                    ...thought.toObject(),
                    isLiked: !!like
                }
            })
        )

        res.status(200).json({
            success: true,
            data: thoughtsWithLike,
            hasMore
        })

    } catch (error) {

        res.status(400).json({
            success: false,
            msg: error.message
        })

    }
})

module.exports = {
    postRouter: router
}