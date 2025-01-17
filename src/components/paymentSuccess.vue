<template>
    <div class="success-container">
        <h1>결제가 성공적으로 완료되었습니다.</h1>
        <p>감사합니다. 결제가 정상적으로 처리되었습니다.</p>
        <router-link to="/">홈으로 돌아가기</router-link>
    </div>
</template>

<style lang="css" scoped>
.success-container {
    text-align: center;
    margin-top: 50px;
}

.success-container a {
    display: inline-block;
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #28a745;
    color: white;
    text-decoration: none;
    border-radius: 4px;
}
</style>