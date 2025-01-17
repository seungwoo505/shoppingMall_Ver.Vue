<template>
    <div>
        <h1 v-if="!cert">이메일 인증 확인 중...</h1>
        <h1 v-else>이메일 인증 완료</h1>
        <button v-if="!cert" v-on:click="checkCert">인증하기</button>
        <button v-else v-on:click="home">메인화면으로 돌아가기</button>
    </div>
</template>

<script setup lang="js">
import router from '@/router';
import { ref } from 'vue';

const cert = ref(false);

const checkCert = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if(!token) return alert("유효하지 않은 인증 링크입니다.");

    try {
        const response = await fetch(`https://seungwoo.i234.me:3333/verify-email?token=${token}`);
        const data = await response.json();

        alert(data.message);

        if(data.success) cert.value = true;
        else cert.value = false;

    } catch (error) {
        console.error(error);
        alert("서버 오류가 발생했습니다.");
    }

};

const home = () => {
    router.push("/");
}
</script>