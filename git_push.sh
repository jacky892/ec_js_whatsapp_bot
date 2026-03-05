#!/bin/bash

# A helper script to quickly add, commit, and push changes to GitHub.
# .gitignore is already configured to avoid non-code files like node_modules/ and .env

echo "Adding tracked files to git..."
git add .

echo "Checking status..."
git status

# Ask for a commit message
echo -n "Enter commit message (or press enter for default 'Update'): "
read commit_msg

if [ -z "$commit_msg" ]; then
    commit_msg="Update"
fi

echo "Committing with message: '$commit_msg'..."
git commit -m "$commit_msg"

echo "Pushing to GitHub..."
git push origin master

echo "Done!"
