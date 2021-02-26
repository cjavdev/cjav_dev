---
title: Creating a file with base64 png dataURL
date: 2021-02-21
---

```rb
  def create
    # Stripe off the bits of the file data that are not part of the binary blob
    base64_file_content = params["thumbnail"]["file"]['data:image/png;base64,'.length..-1]

    # decode from base64
    decoded_image = Base64.decode64(base64_file_content)

    # create a Tempfile
    file = Tempfile.new([Time.now.to_i.to_s, ".png"])
    file.binmode
    file.write(decoded_image)
    file.rewind

    # Do something with your file, including using with ActiveStorage...

    # Clean up the tempfile
    file.close
    file.unlink

    # render or redirect.
  end
```
