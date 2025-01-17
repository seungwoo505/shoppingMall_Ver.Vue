<template>
    <div class = "payment-container">
        <h1>결제</h1>
        <p> 총 금액 : {{ amount }}원</p>
        <div id="payment-widget"></div>
        <button @click="requestPayment">결제하기</button>
    </div>
</template>

<script setup lang="js">
import store from '@/store';
import { ANONYMOUS, loadPaymentWidget } from '@tosspayments/payment-widget-sdk';
import { onMounted, ref } from 'vue';

const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"; // 토스 테스트 키
const customerKey = store.state.session === "" ? ANONYMOUS : store.state.session;
const paymentWidget = ref(null);
const orderId = `ORDER-${store.state.session}-${Date.now()}`;
const amount = 10000;

onMounted(async () => {
    paymentWidget.value = await loadPaymentWidget(clientKey, customerKey);

    paymentWidget.value.renderPaymentMethods('#payment-widget', amount);
});

const requestPayment = async () => {
    try {
        const result = await paymentWidget.value.requestPayment({
            orderId,
            orderName : '테스트_결제',
            successUrl : window.location.origin + "/success",
            failUrl: window.location.origin + "/fail"
        });
        console.log('결제 성공: ', result);
    }catch (err) {
        console.error("결제 실패 : ", err);
    }
}
</script>