// Configuration  
// Update this with your actual API Gateway URL
const API_GATEWAY_URL = 'https://dkor79bcf8.execute-api.eu-west-1.amazonaws.com/Prod';

// Cost tracking for session totals
let totalCosts = {
    claude: 0,
    gemini: 0,
    rekognition: 0,
    total: 0
};

// Disable CORS for local testing (Chrome with --disable-web-security)
// Alternative: Use a simple proxy or run via local server

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
    imageModal: document.getElementById('image-modal'),
    imagesJson: document.getElementById('images-json'),
    rekognitionResponse: document.getElementById('rekognition-response'),
    rekognitionResults: document.getElementById('rekognition-results'),
    labeledGallery: document.getElementById('labeled-gallery')
};


/**
 * Update cost display with actual costs from API responses
 */
function updateCostDisplay(service, actualCostData, details = '') {
    if (!actualCostData || typeof actualCostData.total_cost_usd === 'undefined') {
        console.warn(`No actual cost data available for ${service}`);
        return;
    }
    
    const actualCost = actualCostData.total_cost_usd;
    totalCosts[service] += actualCost;
    totalCosts.total = totalCosts.claude + totalCosts.gemini + totalCosts.rekognition;
    
    // Create or update cost display
    let costElement = document.getElementById(`${service}-cost`);
    if (!costElement) {
        costElement = document.createElement('div');
        costElement.id = `${service}-cost`;
        costElement.className = 'cost-display';
        
        // Find the appropriate results section and add cost display
        const resultsSection = service === 'claude' ? elements.claudeResults :
                              service === 'gemini' ? elements.geminiResults :
                              elements.rekognitionResults;
        
        if (resultsSection) {
            resultsSection.insertBefore(costElement, resultsSection.firstChild);
        }
    }
    
    const costHtml = `
        <div class="cost-info">
            💰 <strong>${service.toUpperCase()} Cost:</strong> $${actualCost.toFixed(6)} ${details}
            <br>💳 <strong>Total Session Cost:</strong> $${totalCosts.total.toFixed(6)}
        </div>
    `;
    
    costElement.innerHTML = costHtml;
}

// Event Listeners
document.getElementById('generate-claude-prompt').addEventListener('click', generateClaudePromptFromConfig);
document.getElementById('populate-claude').addEventListener('click', populateExampleClaudePrompt);
document.getElementById('send-claude').addEventListener('click', sendToClaude);
document.getElementById('next-to-gemini').addEventListener('click', prepareGeminiPayload);
document.getElementById('populate-gemini').addEventListener('click', populateGeminiPayload);
document.getElementById('send-gemini').addEventListener('click', sendToGemini);
document.getElementById('load-generated-images').addEventListener('click', loadGeneratedImages);
document.getElementById('validate-json').addEventListener('click', validateImagesJson);
document.getElementById('analyze-images').addEventListener('click', analyzeImages);

/**
 * Generate Claude prompt using the actual backend template with user configuration
 */
function generateClaudePromptFromConfig() {
    const context = elements.context.value || 'A beautiful landscape';
    const excludeTags = elements.excludeTags.value || 'violence, inappropriate content';
    const numGen = parseInt(elements.numGenerations.value) || 1;
    
    // Warn about large batch sizes
    if (numGen > 50) {
        if (!confirm(`⚠️ You're requesting ${numGen} images.\n⏱️ This will take a long time.\n\nContinue?`)) {
            return;
        }
    } else if (numGen > 20) {
        if (!confirm(`⚠️ You're requesting ${numGen} images.\n⏱️ This may take several minutes.\n\nContinue?`)) {
            return;
        }
    }

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
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Display actual cost from API response
        if (data.cost) {
            const usage = data.response?.usage || {};
            const details = usage.input_tokens ? `(${usage.input_tokens} in + ${usage.output_tokens} out tokens)` : '';
            updateCostDisplay('claude', data.cost, details);
        }
        
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

    // Create Gemini batch payload structure for your backend
    const geminiPayload = {
        requests: []
    };

    // Parse Claude's semicolon-separated prompts
    const prompts = window.claudeResult.split(';').map(p => p.trim()).filter(p => p.length > 0);
    
    prompts.forEach((prompt) => {
        geminiPayload.requests.push({
            contents: [{
                parts: [{
                    text: prompt
                }],
                role: "user"
            }]
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
                contents: [{
                    parts: [{
                        text: "Create a photorealistic image of a serene mountain landscape with a crystal-clear lake reflecting the peaks, surrounded by pine trees, with dramatic clouds in the sky, natural lighting"
                    }],
                    role: "user"
                }]
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
    
    // Final warning for large batches
    const requestCount = parsedPayload.requests ? parsedPayload.requests.length : 0;
    if (requestCount > 20) {
        if (!confirm(`⚠️ Final confirmation: You're about to send ${requestCount} image generation requests to Gemini. This will incur significant costs. Proceed?`)) {
            return; // User can cancel here too
        }
    }

    showLoading(true);
    
    try {
        // Start job
        const response = await fetch(`${API_GATEWAY_URL}/workbench/gemini`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(parsedPayload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const startData = await response.json();
        
        if (startData.job_id) {
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
            const response = await fetch(`${API_GATEWAY_URL}/workbench/status/${jobId}`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Job status: ${data.status}`);
            
            if (data.status === 'completed') {
                // Job finished successfully
                showLoading(false);
                
                // Display actual cost from API response
                if (data.cost) {
                    const imageCount = data.images ? data.images.length : 0;
                    const details = imageCount > 0 ? `(${imageCount} images generated)` : '';
                    updateCostDisplay('gemini', data.cost, details);
                }
                
                elements.geminiResponse.textContent = JSON.stringify(data, null, 2);
                
                // Store generated images for rekognition step
                window.generatedImages = data.images || [];
                
                // Auto-populate images JSON editor
                if (window.generatedImages.length > 0) {
                    elements.imagesJson.value = JSON.stringify(window.generatedImages, null, 2);
                }
                
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

/**
 * Load generated images into JSON editor
 */
function loadGeneratedImages() {
    if (!window.generatedImages || window.generatedImages.length === 0) {
        alert('No generated images available. Please complete Step 3 first.');
        return;
    }
    
    elements.imagesJson.value = JSON.stringify(window.generatedImages, null, 2);
    alert('Generated images loaded into JSON editor.');
}

/**
 * Validate the images JSON
 */
function validateImagesJson() {
    const jsonText = elements.imagesJson.value.trim();
    
    if (!jsonText) {
        alert('JSON editor is empty. Please load generated images or enter valid JSON.');
        return;
    }
    
    try {
        const parsed = JSON.parse(jsonText);
        if (!Array.isArray(parsed)) {
            alert('JSON must be an array of image objects.');
            return;
        }
        
        if (parsed.length === 0) {
            alert('JSON array is empty. Please add some image objects.');
            return;
        }
        
        // Check if images have required fields
        for (let i = 0; i < parsed.length; i++) {
            const img = parsed[i];
            if (!img.url && !img.s3_key) {
                alert(`Image ${i + 1} is missing 'url' or 's3_key' field.`);
                return;
            }
        }
        
        alert(`✅ JSON is valid! Found ${parsed.length} image(s) ready for analysis.`);
    } catch (error) {
        alert(`❌ Invalid JSON: ${error.message}`);
    }
}

/**
 * Analyze images with AWS Rekognition using JSON from editor
 */
async function analyzeImages() {
    const jsonText = elements.imagesJson.value.trim();
    
    if (!jsonText) {
        alert('Please load images into the JSON editor first (Step 4).');
        return;
    }
    
    let imagesToAnalyze;
    try {
        imagesToAnalyze = JSON.parse(jsonText);
        if (!Array.isArray(imagesToAnalyze) || imagesToAnalyze.length === 0) {
            alert('JSON must be a non-empty array of image objects.');
            return;
        }
    } catch (error) {
        alert(`Invalid JSON: ${error.message}`);
        return;
    }

    showLoading(true);
    
    try {
        // Call workbench rekognition endpoint
        const response = await fetch(`${API_GATEWAY_URL}/workbench/rekognition`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                images: imagesToAnalyze
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Get analyzed images
        const analyzedImages = data.labeled_images || data.images || [];
        
        // Display actual cost from API response
        if (data.cost) {
            const details = analyzedImages.length > 0 ? `(${analyzedImages.length} images analyzed)` : '';
            updateCostDisplay('rekognition', data.cost, details);
        }
        
        // Display rekognition results
        elements.rekognitionResponse.textContent = JSON.stringify(data, null, 2);
        elements.rekognitionResults.style.display = 'block';
        
        // Display labeled images with bounding boxes
        displayLabeledImages(analyzedImages);
        
        // Scroll to rekognition section
        document.querySelector('#rekognition-results').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error analyzing images:', error);
        alert('Error analyzing images: ' + error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * Display labeled images with rekognition data
 */
function displayLabeledImages(labeledImages) {
    elements.labeledGallery.innerHTML = '';
    
    if (labeledImages.length === 0) {
        elements.labeledGallery.innerHTML = '<p>No labeled images found</p>';
        return;
    }
    
    labeledImages.forEach((image, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'labeled-image-item';
        
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = `Labeled image ${index + 1}`;
        img.onclick = () => openImageModal(image.url);
        
        const labelsDiv = document.createElement('div');
        labelsDiv.className = 'image-labels';
        
        const labels = image.rekognition_labels || [];
        const confidence = image.bounding_boxes || [];
        
        labelsDiv.innerHTML = `
            <h4>Image ${index + 1}</h4>
            <p><strong>Labels:</strong> ${labels.slice(0, 5).join(', ') || 'None detected'}</p>
            <p><strong>Objects:</strong> ${confidence.length} detected</p>
            <p><strong>Prompt:</strong> ${image.prompt || 'N/A'}</p>
        `;
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(labelsDiv);
        elements.labeledGallery.appendChild(imageContainer);
    });
}

// Initialize with default values
document.addEventListener('DOMContentLoaded', function() {
    elements.context.value = 'Professional product photography';
    elements.excludeTags.value = 'violence, inappropriate content, low quality';
    elements.numGenerations.value = '3';
});