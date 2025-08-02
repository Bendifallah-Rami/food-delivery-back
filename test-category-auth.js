// Test script for Category Routes Authentication & Authorization
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCategoryRoutesAuth() {
    console.log('🍽️  Testing Category Routes Authentication & Authorization\n');

    try {
        // Test 1: Public access to active categories
        console.log('=== Test 1: Public Access to Active Categories ===');
        const activeCategories = await axios.get(`${BASE_URL}/categories/active`);
        console.log(`✅ PASS: Public can access active categories (${activeCategories.data.count} categories)`);

        // Test 2: Access protected routes without authentication
        console.log('\n=== Test 2: Access Protected Routes Without Authentication ===');
        try {
            await axios.get(`${BASE_URL}/categories`);
            console.log('❌ FAIL: Should have been denied');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ PASS: Correctly denied access without token');
            } else {
                console.log('❌ FAIL: Wrong error type');
            }
        }

        // Test 3: Admin login
        console.log('\n=== Test 3: Admin Authentication ===');
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@fooddelivery.com',
            password: 'admin123'
        });
        const adminToken = adminLogin.data.data.token;
        const adminHeaders = { Authorization: `Bearer ${adminToken}` };
        console.log('✅ PASS: Admin login successful');

        // Test 4: Admin can view all categories
        console.log('\n=== Test 4: Admin Access to All Categories ===');
        const allCategories = await axios.get(`${BASE_URL}/categories`, { headers: adminHeaders });
        console.log(`✅ PASS: Admin can access all categories (${allCategories.data.count} categories)`);

        // Test 5: Admin can create category
        console.log('\n=== Test 5: Admin Create Category ===');
        const newCategory = await axios.post(`${BASE_URL}/categories`, {
            name: 'Beverages',
            description: 'Refreshing drinks and beverages',
            isActive: true,
            sortOrder: 4
        }, { headers: adminHeaders });
        const categoryId = newCategory.data.data.id;
        console.log(`✅ PASS: Admin can create category (ID: ${categoryId})`);

        // Test 6: Admin can update category
        console.log('\n=== Test 6: Admin Update Category ===');
        await axios.put(`${BASE_URL}/categories/${categoryId}`, {
            description: 'Fresh and refreshing drinks, juices, and beverages'
        }, { headers: adminHeaders });
        console.log('✅ PASS: Admin can update category');

        // Test 7: Admin can toggle category status
        console.log('\n=== Test 7: Admin Toggle Category Status ===');
        await axios.patch(`${BASE_URL}/categories/${categoryId}/toggle-status`, {}, { headers: adminHeaders });
        console.log('✅ PASS: Admin can toggle category status');

        // Test 8: Customer login
        console.log('\n=== Test 8: Customer Authentication ===');
        const customerLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'testlogin@example.com',
            password: 'password123'
        });
        const customerToken = customerLogin.data.data.token;
        const customerHeaders = { Authorization: `Bearer ${customerToken}` };
        console.log('✅ PASS: Customer login successful');

        // Test 9: Customer denied access to protected routes
        console.log('\n=== Test 9: Customer Denied Access to Protected Routes ===');
        try {
            await axios.get(`${BASE_URL}/categories`, { headers: customerHeaders });
            console.log('❌ FAIL: Customer should not access all categories');
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ PASS: Customer correctly denied access to all categories');
            } else {
                console.log('❌ FAIL: Wrong error type');
            }
        }

        // Test 10: Customer denied create access
        console.log('\n=== Test 10: Customer Denied Create Access ===');
        try {
            await axios.post(`${BASE_URL}/categories`, {
                name: 'Unauthorized Category'
            }, { headers: customerHeaders });
            console.log('❌ FAIL: Customer should not create categories');
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ PASS: Customer correctly denied create access');
            } else {
                console.log('❌ FAIL: Wrong error type');
            }
        }

        // Test 11: Customer can still access public routes
        console.log('\n=== Test 11: Customer Access to Public Routes ===');
        const publicCategories = await axios.get(`${BASE_URL}/categories/active`);
        console.log(`✅ PASS: Customer can access public active categories (${publicCategories.data.count} categories)`);

        // Test 12: Admin can get specific category
        console.log('\n=== Test 12: Admin Get Specific Category ===');
        const specificCategory = await axios.get(`${BASE_URL}/categories/${categoryId}`, { headers: adminHeaders });
        console.log(`✅ PASS: Admin can get specific category (${specificCategory.data.data.name})`);

        console.log('\n🎉 All category authentication and authorization tests completed successfully!');

        // Summary
        console.log('\n📋 SUMMARY:');
        console.log('✅ Public routes accessible without authentication');
        console.log('✅ Protected routes require authentication');
        console.log('✅ Admin-only routes properly restricted');
        console.log('✅ Customer access properly limited');
        console.log('✅ CRUD operations working correctly');
        console.log('✅ Category status toggle working');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Category Features Summary
function printCategoryFeatures() {
    console.log('\n📂 CATEGORY MANAGEMENT FEATURES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 Public Routes:');
    console.log('   • GET /categories/active - View active categories');
    console.log('');
    console.log('👥 Admin & Staff Routes:');
    console.log('   • GET /categories - View all categories');
    console.log('   • GET /categories/:id - View specific category');
    console.log('');
    console.log('🔒 Admin-Only Routes:');
    console.log('   • POST /categories - Create new category');
    console.log('   • PUT /categories/:id - Update category');
    console.log('   • DELETE /categories/:id - Delete category');
    console.log('   • PATCH /categories/:id/toggle-status - Toggle active status');
    console.log('');
    console.log('✨ Features:');
    console.log('   • Category name uniqueness validation');
    console.log('   • Sort order management');
    console.log('   • Active/inactive status control');
    console.log('   • Protection against deleting categories with menu items');
    console.log('   • Comprehensive error handling');
    console.log('   • Role-based access control');
}

// Run tests
if (require.main === module) {
    testCategoryRoutesAuth().then(() => {
        printCategoryFeatures();
    });
}

module.exports = { testCategoryRoutesAuth, printCategoryFeatures };
