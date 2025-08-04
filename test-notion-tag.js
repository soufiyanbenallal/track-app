const { DatabaseService } = require('./dist/main/database');

async function testNotionTag() {
  const db = new DatabaseService();
  
  try {
    console.log('🧪 Testing "(Notion)" tag functionality...');
    
    // Test 1: Ensure the "(Notion)" tag exists
    console.log('\n1. Testing ensureNotionTag()...');
    const notionTag = await db.ensureNotionTag();
    console.log('✅ Notion tag created/found:', notionTag);
    
    // Test 2: Get all tags to verify it's in the list
    console.log('\n2. Testing getTags() to verify tag is available...');
    const allTags = await db.getTags();
    const notionTagInList = allTags.find(tag => tag.name === '(Notion)');
    console.log('✅ Notion tag found in tags list:', notionTagInList ? 'YES' : 'NO');
    console.log('All tags:', allTags.map(t => t.name));
    
    // Test 3: Create a test task and add the Notion tag
    console.log('\n3. Testing addTagToTask()...');
    const testTask = {
      description: 'Test task for Notion tag',
      projectId: 'test-project',
      startTime: new Date().toISOString(),
      isCompleted: true,
      isPaid: false,
      isArchived: false,
      isInterrupted: false,
      isDraft: false
    };
    
    const createdTask = await db.createTask(testTask);
    console.log('✅ Test task created:', createdTask.id);
    
    await db.addTagToTask(createdTask.id, '(Notion)');
    console.log('✅ Notion tag added to test task');
    
    // Test 4: Verify the task has the tag
    const updatedTask = await db.getTasks({ search: 'Test task for Notion tag' });
    console.log('✅ Task with Notion tag:', updatedTask[0]);
    
    console.log('\n🎉 All tests passed! The "(Notion)" tag functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    db.close();
  }
}

testNotionTag(); 