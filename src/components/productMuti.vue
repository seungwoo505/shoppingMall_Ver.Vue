<template>
    <div class="product-list">
        <h1>상품 목록</h1>
        <div v-if="Products?.length === 0">상품이 없습니다.</div>
        <div v-else>
            <div
                v-for="product in products"
                :key="product.ID"
                class="product-card"
                @click="goToDetail(product.ID)"
                >
                <h2>{{ product.TITLE }}</h2>
                <p>{{ product.DESCRIPTION }}</p>
                <div v-if="product.IMAGES && product.IMAGES.length">
                    <img :src="product.IMAGES[0]" alt="프로젝트 이미지"/>
                </div>
            </div>
        </div>
        <button v-if="store.state.admin" @click="goToEdit">상품 등록</button>
    </div>
</template>

<script setup lang="js">
import store from '@/store';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';


const products = ref([]);
const router = useRouter();

const fetchProducts = async () => {
    try {
        const response = await fetch("https://seungwoo.i234.me:3333/products");
        const data = await response.json();
        if(response.ok) products.value = data.products;
        else alert(data.message);
    } catch (error) {
        console.error("상품 목록 불러오기 실패 : ", error);
    }
};

const goToDetail = (productId) => {
    router.push(`/product/${productId}`);
};

const goToEdit = () => {
    router.push(`/product/insert`);
};

onMounted(() => {
    fetchProducts();
});
</script>

<style lang="css" scoped>
.product-list {
    max-width: 800px;
    margin: auto;
}

.product-card {
    border: 1px solid #ddd;
    padding: 1em;
    margin: 1em 0;
    cursor: pointer;
}

.product-card img {
    max-width: 100%;
    height: auto;
}
</style>