<template>
    <div class="product-detail">
        <h1>{{ product.TITLE }}</h1>
        <p>{{ product.DESCRIPTION }}</p>
        <div v-if="product.SKILLS && product.SKILLS.length">
            <h3>개발 스킬</h3>
            <ul>
                <li v-for="(skill, index) in product.SKILLS" :key="index">{{ product.SKILLS[index] }}</li>
            </ul>
        </div>

        <div v-if="product.IMAGES && product.IMAGES.length">
            <h3>이미지</h3>
            <div class="image-container">
                <img v-for="(image, index) in product.IMAGES" :key="index" :src="'https://seungwoo.i234.me/' + image" alt="프로젝트 이미지"/>
            </div>
        </div>
        <button v-if="store.state.admin" @click="goToEdit">수정하기</button>
        <button v-if="store.state.admin" @click="deleteProduct">삭제하기</button>
    </div>
</template>

<script setup lang="js">
import store from '@/store';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';


const product = ref({
    TITLE : "",
    DESCRIPTION : "",
    SKILLS : [],
    IMAGES : []
});
const router = useRouter();
const route = useRoute();

const fetchProduct = async () => {
    try {
        const response = await fetch(`https://seungwoo.i234.me:3333/product/${route.params.id}`);
        const data = await response.json();
        if(response.ok){
            product.value = data.product;
            product.value.SKILLS = JSON.parse(product.value.SKILLS);
            product.value.IMAGES = JSON.parse(product.value.IMAGES);
        }else{
            alert(data.message);
        }

    } catch (error) {
        console.error("상품 상세 불러오기 오류 : " + error);
        alert("오류가 발생했습니다. 다시 시도해주세요");
    }
};

const goToEdit = () => {
    router.push(`/product/update/${route.params.id}`);
};

const deleteProduct = async () => {
    if(!confirm("정말로 삭제하시겠습니까?")) return;

    try{
        const response = await fetch(`https://seungwoo.i234.me:3333/product/delete/${route.params.id}`, { method : "DELETE"});
        const data = await response.json();

        alert(data.message);

        if(response.ok) router.push("/products");
    }catch(error){
        console.error("상품 삭제 오류 : ", error);
        alert("오류가 발생했습니다. 다시 시도해주세요");
    }
}

onMounted(() => {
    fetchProduct();
});
</script>

<style lang="css" scoped>
.product-detail {
    max-width: 800px;
    margin: auto;
}

.image-container {
    display: flex;
    gap: 10px;
}

.image-container img {
    max-width: 200px;
    height: auto;
    border: 1px solid #ddd;
}
</style>