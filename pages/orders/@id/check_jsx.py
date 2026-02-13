import sys

def check_tags(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    tags = []
    i = 0
    while i < len(content):
        if content[i:i+1] == '<':
            if content[i:i+2] == '</':
                end = content.find('>', i)
                tag_name = content[i+2:end].split()[0]
                if tags and tags[-1] == tag_name:
                    tags.pop()
                else:
                    print(f"Mismatched closing tag: </{tag_name}> at index {i}")
                    if tags:
                        print(f"Last opened was: <{tags[-1]}>")
                i = end + 1
            elif content[i:i+4] == '<!--':
                end = content.find('-->', i)
                i = end + 3
            else:
                end = content.find('>', i)
                if end != -1:
                    tag_line = content[i+1:end]
                    if not tag_line.endswith('/') and not tag_line.startswith('!'):
                        tag_name = tag_line.split()[0]
                        if tag_name and not tag_name.startswith('{'):
                            tags.append(tag_name)
                    i = end + 1
                else:
                    i += 1
        else:
            i += 1
    
    if tags:
        print(f"Unclosed tags: {tags}")

check_tags('/home/opus/Projects/Sublymus/Delivery/delivery-dash-etp/pages/orders/@id/+Page.tsx')
