import boto3
import cv2
import os
import json

f = open('config.json')

data = json.load(f)

s3 = boto3.client('s3',
                  aws_access_key_id = data['awskid'],
                  aws_secret_access_key = data['awssac'],
                  region_name = data['region']
                  )

input_bucket = 'arslreadytoprocess'
output_bucket = 'arslprocessed'
input_prefix = 'input-images/'
output_prefix = 'output-images/'


def process_images_in_subfolder(input_subfolder):
    input_objects = s3.list_objects(Bucket=input_bucket, Prefix=input_prefix + input_subfolder)

    for obj in input_objects.get('Contents', []):
        input_object_key = obj['Key']
        modified_string = input_object_key.replace("input-images/", "")
        output_subfolder = os.path.dirname(modified_string)
        process_and_upload_images(input_object_key, output_subfolder)

def process_and_upload_images(input_object_key, output_subfolder):

    input_image_path = f'{input_object_key}'
    input_directory = os.path.dirname(input_object_key)
    os.makedirs(input_directory, exist_ok=True)
    s3.download_file(input_bucket, input_object_key, input_image_path)
    image = cv2.imread(input_image_path)

    image = cv2.resize(image, (250, 350))
    reflected_image = cv2.flip(image, 1)


    duplicated_reflected = [reflected_image.copy() for _ in range(2)]

    duplicated_images = [image.copy() for _ in range(2)]

    for i, (duplicated_image,duplicated_reflected_image) in enumerate(zip(duplicated_images, duplicated_reflected)):

        rotation_angle = 30
        rows, cols, _ = duplicated_image.shape
        rows2, cols2, _ = duplicated_reflected_image.shape
        rotation_matrix = cv2.getRotationMatrix2D((cols / 2, rows / 2), rotation_angle, 1)
        rotation_matrix2 = cv2.getRotationMatrix2D((cols2 / 2, rows2 / 2), rotation_angle, 1)
        rotated_image = cv2.warpAffine(duplicated_image, rotation_matrix, (cols, rows))
        rotated_image2 = cv2.warpAffine(duplicated_reflected_image, rotation_matrix2, (cols2, rows2))
        
        processed_images = []

        processed_images.append(rotated_image)
        processed_images.append(rotated_image2)
        processed_images.append(reflected_image)
        processed_images.append(image)

        output_directory = output_prefix + output_subfolder
        os.makedirs(output_directory, exist_ok=True)

        for j, processed_image in enumerate(processed_images):
            output_object_key = f'{output_directory}/{os.path.basename(input_object_key).split(".")[0]}_{i * len(processed_images) + j}.jpg'
            output_image_path = f'{output_object_key}'
            print(output_image_path)

            cv2.imwrite(output_image_path, processed_image)

            s3.upload_file(output_image_path, output_bucket, output_object_key)

        print(f'Processed and uploaded {input_object_key} with {len(processed_images)} variations.')

response = s3.list_objects(Bucket=input_bucket, Prefix=input_prefix, Delimiter='/')

input_subfolders = [prefix.get('Prefix').split('/')[-2] for prefix in response.get('CommonPrefixes', [])]

for subfolder in input_subfolders:
    process_images_in_subfolder(subfolder)

print("Image processing complete.")