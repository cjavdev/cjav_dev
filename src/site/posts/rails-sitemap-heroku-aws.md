---
title: Rails + Sitemap + Heroku + AWS
date: 2015-04-11
---

tl;dr Generate the sitemap files, push them to AWS and set up a route that redirects to those files from Rails.

While exploring google web master tools and inspecting some aspects of Insider AI SEO, I recognized a missing piece of the puzzle: sitemap! There are a few options out there for generating sitemaps for Rails, most of which generate a set of XML files and drop them in your public directory. This wont work for Insider AI as it has dynamic blog content that I want mapped so that it’s indexed by search engines. If you’ve worked much with Heroku, you know that it’s not a static file server. In fact, if you generate or attempt to store uploaded files on Heroku, they’ll get stomped out :(.

**Goal:** Generate dynamic sitemaps.

**Problem:** Heroku doesn’t play nice with generated static files.

**Solution:** Upload generated sitemaps to AWS.

The gem I landed on is called [`sitemap_generator`](https://github.com/kjvarga/sitemap_generator). In the wiki on their github page there are some examples for getting up and running with [Fog and CarrierWave](https://github.com/kjvarga/sitemap_generator/wiki/Generate-Sitemaps-on-read-only-filesystems-like-Heroku).

These solutions were a bit heavy weight for me, so I ended up modifying [this code](https://github.com/kjvarga/sitemap_generator/wiki/Uploading-the-sitemap-to-S3-with-paperclip,-aws-s3-and-aws-sdk). To eventually have a nice solution for generating sitemaps and uploading them to AWS.

Here’s everything you need to know:

1. [Sign up for AWS](http://aws.amazon.com/s3/)
2. [Create an IAM User](https://console.aws.amazon.com/iam/home?region=us-west-2#users) (note the KEY_ID and ACCESS_KEY)
3. [Create a bucket on S3](https://console.aws.amazon.com/s3/home?region=us-west-2) (note the bucket name as BUCKET)
4. Add a policy to the bucket to allow uploading (they have a policy generator, or you can use this overly promiscuous one)

```json
{
    "Version": "2012-10-17",
    "Id": "Policy1",
    "Statement": [
        {
            "Sid": "Stmt1",
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::YOUR_AWS_BUCKET_NAME/*"
        }
    ]
}
```

5. Add these gems to the Gemfile (I use figaro for key management)

```ruby
# Gemfile
gem 'aws-sdk', '< 2.0'
gem 'figaro'
gem 'sitemap_generator'
```

7. Install figaro (creates config/application.yml and git ignores it, safety first!)

```bash
figaro install
```

8. Make the keys and bucket name available to the env. config/application.yml

```yaml
AWS_ACCESS_KEY_ID: KEY_ID
AWS_SECRET_ACCESS_KEY: ACCESS_KEY
AWS_BUCKET: BUCKET
```

9. Create config/sitemap.rb to define what gets mapped

```ruby
# config/sitemap.rb
SitemapGenerator::Sitemap.default_host = "https://cjavdev.netlify.app/"
SitemapGenerator::Sitemap.create_index = true
SitemapGenerator::Sitemap.public_path = 'public/sitemaps/'
SitemapGenerator::Sitemap.create do
  add '/welcome'
  add '/blog'
  add '/about'
  Post.find_each do |post|
    add post_path(post), lastmod: post.updated_at
  end
end
```

10. Create lib/tasks/sitemap.rake to define the rake task for refreshing the sitemap

```ruby
require 'aws'
namespace :sitemap do
  desc 'Upload the sitemap files to S3'
  task upload_to_s3: :environment do
    s3 = AWS::S3.new(
      access_key_id: ENV['AWS_ACCESS_KEY_ID'],
      secret_access_key: ENV['AWS_SECRET_ACCESS_KEY']
    )
    bucket = s3.buckets[ENV['AWS_BUCKET']]
    Dir.entries(File.join(Rails.root, "public", "sitemaps")).each do |file_name|
      next if ['.', '..'].include? file_name
      path = "sitemaps/#{file_name}"
      file = File.join(Rails.root, "public", "sitemaps", file_name)

      begin
        object = bucket.objects[path]
        object.write(file: file)
      rescue Exception => e
        raise e
      end
      puts "Saved #{file_name} to S3"
    end
  end
end
```

11. Redirect requests for your sitemap to the files stored on AWS. (Needs improvement, but works)

```ruby
# config/routes.rb
get "sitemap.xml.gz" => "sitemaps#sitemap", format: :xml, as: :sitemap

# app/controllers/sitemaps_controller.rb
class SitemapsController < ApplicationController
  def sitemap
    redirect_to "https://s3.amazonaws.com/#{ ENV['AWS_BUCKET'] }/sitemaps/sitemap.xml.gz"
  end
end
```

Hope this helps! Let me know if you get stuck somewhere and I’ll do my best to help you out 🙂
