// Configuration  
// Update this with your actual API Gateway URL
const API_GATEWAY_URL = 'https://your-api-gateway-url.amazonaws.com';

// DOM Elements
const elements = {
    context: document.getElementById('context'),
    excludeTags: document.getElementById('exclude-tags'),
    numGenerations: document.getElementById('num-generations'),
    claudePrompt: document.getElementById('claude-prompt'),
    geminiPayload: document.getElementById('gemini-payload'),
    claudeResponse: document.getElementById('claude-response'),
    geminiResponse: document.getElementById('gemini-response'),
    claudeResults: document.getElementById('claude-results'),
    geminiResults: document.getElementById('gemini-results'),
    imageGallery: document.getElementById('image-gallery'),
    loading: document.getElementById('loading'),
    modalImage: document.getElementById('modal-image'),
    imageModal: document.getElementById('image-modal')
};

// Event Listeners
document.getElementById('generate-claude-prompt').addEventListener('click', generateClaudePromptFromConfig);
document.getElementById('populate-claude').addEventListener('click', populateExampleClaudePrompt);
document.getElementById('send-claude').addEventListener('click', sendToClaude);
document.getElementById('next-to-gemini').addEventListener('click', prepareGeminiPayload);
document.getElementById('populate-gemini').addEventListener('click', populateGeminiPayload);
document.getElementById('send-gemini').addEventListener('click', sendToGemini);

/**
 * Generate Claude prompt using the actual backend template with user configuration
 */
function generateClaudePromptFromConfig() {
    const context = elements.context.value || 'A beautiful landscape';
    const excludeTags = elements.excludeTags.value || 'violence, inappropriate content';
    const numGen = elements.numGenerations.value || 1;

    // Use the exact prompt template from backend/lambdas/generate_prompts.py
    const actualPrompt = `Generate exactly ${numGen} diverse, realistic image prompts based on: "${context}"

Rules:
- Each prompt should be a complete, detailed scene description
- Exclude these elements: ${excludeTags}
- Keep each prompt under 50 words
- Make them diverse but thematically related to the original context
- They should be suitable for generating high-quality images
- Scene is always photo realistic with natural lighting
- Include a variety of perspectives and compositions
- Use dynamic angles and framing, realistic motion to enhance visual interest
- Situations can be indoors or outdoors, day or night, urban or nature
- Separate each prompt with a semicolon (;)
- Do not number them or add extra formatting
- Return only the prompts separated by semicolons

Example format: "prompt 1; prompt 2; prompt 3"`;

    elements.claudePrompt.value = actualPrompt;
}

/**
 * Populate Claude prompt with example for testing
 */
function populateExampleClaudePrompt() {
    const examplePrompt = `Generate exactly 3 diverse, realistic image prompts based on: "Professional cats in office settings"

Rules:
- Each prompt should be a complete, detailed scene description
- Exclude these elements: violence, inappropriate content, low quality
- Keep each prompt under 50 words
- Make them diverse but thematically related to the original context
- They should be suitable for generating high-quality images
- Scene is always photo realistic with natural lighting
- Include a variety of perspectives and compositions
- Use dynamic angles and framing, realistic motion to enhance visual interest
- Situations can be indoors or outdoors, day or night, urban or nature
- Separate each prompt with a semicolon (;)
- Do not number them or add extra formatting
- Return only the prompts separated by semicolons

Example format: "prompt 1; prompt 2; prompt 3"`;

    elements.claudePrompt.value = examplePrompt;
}

/**
 * Send prompt to Claude API
 */
async function sendToClaude() {
    const prompt = elements.claudePrompt.value.trim();
    
    if (!prompt) {
        alert('Please enter a Claude prompt');
        return;
    }

    showLoading(true);
    
    try {
        // Call workbench Claude endpoint
        const response = await fetch(`${API_GATEWAY_URL}/workbench/claude`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Display Claude response
        elements.claudeResponse.textContent = JSON.stringify(data, null, 2);
        elements.claudeResults.style.display = 'block';
        
        // Extract raw text from workbench Claude response
        const claudeText = data.raw_text || '';
        
        // Store Claude text for next step
        window.claudeResult = claudeText;
        
    } catch (error) {
        console.error('Error calling Claude API:', error);
        alert('Error calling Claude API: ' + error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * Prepare Gemini payload from Claude results
 */
function prepareGeminiPayload() {
    if (!window.claudeResult) {
        alert('No Claude results to prepare Gemini payload');
        return;
    }

    // Create Gemini batch payload structure
    const geminiPayload = {
        requests: []
    };

    // Parse Claude's semicolon-separated prompts
    const prompts = window.claudeResult.split(';').map(p => p.trim()).filter(p => p.length > 0);
    
    prompts.forEach((prompt) => {
        geminiPayload.requests.push({
            model: "gemini-1.5-flash",
            contents: [{
                parts: [{
                    text: `Generate a detailed image description based on this prompt: ${prompt}`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000
            }
        });
    });

    elements.geminiPayload.value = JSON.stringify(geminiPayload, null, 2);
    
    // Scroll to Gemini section
    document.querySelector('.step-section:last-of-type').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Populate default Gemini payload for testing
 */
function populateGeminiPayload() {
    const defaultPayload = {
        requests: [
            {
                model: "gemini-1.5-flash",
                contents: [{
                    parts: [{
                        text: "Generate a detailed image of a serene mountain landscape with a crystal-clear lake reflecting the peaks, surrounded by pine trees, with dramatic clouds in the sky, photorealistic style"
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                }
            }
        ]
    };

    elements.geminiPayload.value = JSON.stringify(defaultPayload, null, 2);
}

/**
 * Send batch request to Gemini Flash
 */
async function sendToGemini() {
    const payload = elements.geminiPayload.value.trim();
    
    if (!payload) {
        alert('Please enter a Gemini payload');
        return;
    }

    let parsedPayload;
    try {
        parsedPayload = JSON.parse(payload);
    } catch (error) {
        alert('Invalid JSON payload');
        return;
    }

    showLoading(true);
    
    try {
        // Start job
        const response = await fetch(`${API_GATEWAY_URL}/workbench/gemini`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(parsedPayload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const startData = await response.json();
        
        if (startData.job_id) {
            // Start polling for results
            pollJobStatus(startData.job_id);
        } else {
            throw new Error('No job_id received');
        }
        
    } catch (error) {
        console.error('Error starting Gemini job:', error);
        alert('Error starting Gemini job: ' + error.message);
        showLoading(false);
    }
}

/**
 * Poll job status with configurable timeout
 */
async function pollJobStatus(jobId) {
    const maxWaitTime = 300000; // 5 minutes
    const pollInterval = 5000;   // 5 seconds
    const startTime = Date.now();
    
    console.log(`Starting to poll job: ${jobId}`);
    
    const poll = async () => {
        try {
            // Check timeout
            if (Date.now() - startTime > maxWaitTime) {
                showLoading(false);
                alert('Job timeout - taking longer than expected. Check status manually.');
                return;
            }
            
            // Check status
            const response = await fetch(`${API_GATEWAY_URL}/workbench/status/${jobId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Job status: ${data.status}`);
            
            if (data.status === 'completed') {
                // Job finished successfully
                showLoading(false);
                elements.geminiResponse.textContent = JSON.stringify(data, null, 2);
                displayImageGallery(data);
                elements.geminiResults.style.display = 'block';
                console.log('Job completed successfully');
                
            } else if (data.status === 'failed' || data.status === 'error') {
                // Job failed
                showLoading(false);
                alert(`Job failed: ${data.message}`);
                elements.geminiResponse.textContent = JSON.stringify(data, null, 2);
                elements.geminiResults.style.display = 'block';
                
            } else {
                // Still processing, continue polling
                setTimeout(poll, pollInterval);
            }
            
        } catch (error) {
            console.error('Error polling job status:', error);
            showLoading(false);
            alert('Error checking job status: ' + error.message);
        }
    };
    
    // Start polling
    poll();
}

/**
 * Display images in gallery format
 */
function displayImageGallery(data) {
    elements.imageGallery.innerHTML = '';
    
    // Extract images from response (adjust based on your actual response structure)
    const images = extractImagesFromResponse(data);
    
    if (images.length === 0) {
        elements.imageGallery.innerHTML = '<p>No images found in response</p>';
        return;
    }
    
    images.forEach((imageUrl, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-item';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Generated image ${index + 1}`;
        img.onclick = () => openImageModal(imageUrl);
        
        const caption = document.createElement('p');
        caption.textContent = `Image ${index + 1}`;
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(caption);
        elements.imageGallery.appendChild(imageContainer);
    });
}

/**
 * Extract image URLs from API response
 * Adjust this function based on your actual API response structure
 */
function extractImagesFromResponse(data) {
    const images = [];
    
    // Extract S3 image URLs from workbench Gemini response
    if (data.images && Array.isArray(data.images)) {
        data.images.forEach(img => {
            if (img.url) {
                images.push(img.url);
            }
        });
    }
    
    return images;
}

/**
 * Show/hide loading indicator
 */
function showLoading(show) {
    elements.loading.style.display = show ? 'block' : 'none';
}

/**
 * Toggle accordion sections
 */
function toggleAccordion(elementId) {
    const content = document.getElementById(elementId);
    const header = content.previousElementSibling;
    const toggle = header.querySelector('.accordion-toggle');
    
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▼';
    }
}

/**
 * Open image in modal
 */
function openImageModal(imageUrl) {
    elements.modalImage.src = imageUrl;
    elements.imageModal.style.display = 'block';
}

/**
 * Close image modal
 */
function closeModal() {
    elements.imageModal.style.display = 'none';
}

// Close modal when clicking outside the image
window.onclick = function(event) {
    if (event.target === elements.imageModal) {
        closeModal();
    }
}

// Initialize with default values
document.addEventListener('DOMContentLoaded', function() {
    elements.context.value = 'Professional product photography';
    elements.excludeTags.value = 'violence, inappropriate content, low quality';
    elements.numGenerations.value = '3';
});