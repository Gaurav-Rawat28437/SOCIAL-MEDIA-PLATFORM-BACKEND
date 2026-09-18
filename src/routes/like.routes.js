const express = require("express")

const { likeModel } = require("../models/like.model")
const { postModel } = require("../models/post.model")

const router = express.Router()



router.get("/my-likes", async (req, res) => {

    try {

        const userId = req.foundUser._id

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 18
        const skip = (page - 1) * limit

        const totalLikes = await likeModel.countDocuments({
            user: userId
        })

        const likes = await likeModel
            .find({
                user: userId
            })
            .populate({
                path: "post",
                select:
                    "content imgUrl authorId likesCount commentsCount repostsCount createdAt",
                populate: {
                    path: "authorId",
                    select:
                        "displayPicture username firstName lastName"
                }
            })
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(limit)

        const hasMore =
            skip + likes.length < totalLikes

        return res.status(200).json({
            success: true,
            data: likes,
            pagination: {
                page,
                limit,
                total: totalLikes,
                hasMore
            }
        })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success: false,
            msg: "Unable to get liked posts"
        })
    }
})


router.post("/:postId", async (req, res) => {

    try {

        const userId = req.foundUser._id
        const { postId } = req.params


        const alreadyLiked = await likeModel.findOne({
            user: userId,
            post: postId
        })

        if (alreadyLiked) {

            return res.status(400).json({
                success: false,
                msg: "Post already liked"
            })
        }

        await likeModel.create({
            user: userId,
            post: postId
        })

        const updatedPost = await postModel.findByIdAndUpdate(
            postId,
            {
                $inc: {
                    likesCount: 1
                }
            },
            {
                returnDocument: "after"
            }
        )

        return res.status(200).json({
            success: true,
            msg: "Post liked successfully",
            likesCount: updatedPost.likesCount
        })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success: false,
            msg: "Unable to like post"
        })
    }
})


router.delete("/:postId", async (req, res) => {

    try {

        const userId = req.foundUser._id
        const { postId } = req.params

        const like = await likeModel.findOne({
            user: userId,
            post: postId
        })

        if (!like) {

            return res.status(400).json({
                success: false,
                msg: "Post is not liked"
            })
        }

        await likeModel.deleteOne({
            _id: like._id
        })

        const updatedPost = await postModel.findByIdAndUpdate(
            postId,
            {
                $inc: {
                    likesCount: -1
                }
            },
            {
                new: true
            }
        )

        return res.status(200).json({
            success: true,
            msg: "Post unliked successfully",
            likesCount: updatedPost.likesCount
        })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success: false,
            msg: "Unable to unlike post"
        })
    }
})


module.exports = {
    likeRouter: router
}