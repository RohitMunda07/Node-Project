import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()

router.route("/:channelId").patch(
    jwtVerify,
    toggleSubscription
).get(
    jwtVerify,
    getUserChannelSubscribers
)

router.route("/subscribed-channels/:subscriberId").get(
    jwtVerify,
    getSubscribedChannels
)

export default router