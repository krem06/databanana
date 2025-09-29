Data Banana is a pwa which allow users to generate batches of 100 realistic images at once, then automatically add tags and annotations to export them in standard dataset formats to be used to train LLMs. The valid images (ie: realistic) which are the ones selected by user are then added to a public gallery for anybody to access and download for free without meta data. People can also pay 0.1$ by image to export a group of images in dataset standard formats with meta data.

The pwa consists of 4 pages:
Home > Platform presentation
Gallery > Browse already created images filtered by tags
Batch generation >
+ User add a realistic short context sentence (80 chars) + tags to exclude from the scene.
+ If no credits we show popup to add at least 5$ credits (100 images)
+ ⁠User context and tags are sent to Claude haiku to create realistic 100 variants from base context
+ ⁠We call nano banana API in batch mode for 100 images with the generated variants
+ Once images received, they are sent to AWS rekognition to add tags and annotations
+ User see visuals appear in page, one by one they have to select the visuals they validate as useful (realistic variations) and finally export them in the desired standard dataset format of there choice.
+ ⁠Once user proceed with export, the selected visuals are uploaded to a S3 server and the file reference saved in database along with tags and annotations. Zip is generated with a link to download.
Account > Basic details + add credits using stripe

Business model:
LLMs have to be trained with visual datasets, there is a necessity for datasets properly tagged and annotated which will grow overtime. DataBanana tries to be the reference source for syntetic visual images.

Monetization:
The cost to generate images with tags and annotations is low, for 100 images 2.11$:
+ Gemini 2.5 Flash Image (100 images, batch): $1.95 (92%)
+ Claude 3.5 Haiku (100 prompts, batch): $0.05 (2%)
+ AWS Rekognition (100 image tags): $0.10 (5%)

People pay 5$ to generate 100 images and then validate results. All verified results are published in a public gallery where people can download individual visuals for free with no meta data. People can also select images and export them with meta data in a dataset format for 0.1$/image.

Technical:
S3 is used to store images as the number could grow quickly
Stripe for paiements
Reactjs for UI
I believe i should use postgresql on aws but tell me what you think before we start the process
