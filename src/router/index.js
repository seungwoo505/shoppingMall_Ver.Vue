import LoginCheck from "@/components/loginCheck.vue";
import PaymentFail from "@/components/paymentFail.vue";
import PaymentSuccess from "@/components/paymentSuccess.vue";
import ProductDetail from "@/components/productDetail.vue";
import ProductMerge from "@/components/productMerge.vue";
import Products from "@/components/productMuti.vue";
import ShoppingBasket from "@/components/shoppingBasket.vue";
import SignUp from "@/components/SignUp.vue";
import VerifyEmail from "@/components/verifyEmail.vue";
import { createRouter, createWebHistory } from "vue-router";
import changePassword from "@/components/changePassword.vue";
import deleteAccount from "@/components/deleteAccount.vue";
import mypage from "@/components/myPage.vue";

const routes = [
    {
        path : "/",
        component : LoginCheck
    },

    {
        path : "/sign",
        component : SignUp
    },

    {
        path : "/basket",
        component : ShoppingBasket
    },

    {
        path : "/success",
        component : PaymentSuccess
    },

    {
        path : "/fail",
        component : PaymentFail
    },

    {
        path : "/products",
        component : Products
    },

    {
        path : "/product/:id",
        component : ProductDetail
    },

    {
        path : "/product/insert",
        component : ProductMerge
    },

    {
        path : "/product/update/:id",
        component : ProductMerge
    },

    {
        path : "/verify-email",
        component : VerifyEmail
    },

    {
        path : "/myPage",
        component: mypage
    },

    {
        path : "/changePassword",
        component : changePassword
    },

    {
        path : "/deleteAccount",
        component: deleteAccount
    }
];

const router = createRouter({
    history : createWebHistory(),
    routes
});

export default router;