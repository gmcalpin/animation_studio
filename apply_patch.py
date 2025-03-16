#!/usr/bin/env python3
"""
apply_patch.py - A utility to apply text patches to source files with Git integration

Usage:
  python apply_patch.py patch_file.txt target_file.js [--backup] [--mode=replace|append|prepend|smart|functions] [--git-commit] [--commit-msg=MESSAGE]
  
Options:
  --backup            Create a backup of the original file before applying the patch
  --mode              Patch application mode (default: replace)
                      - replace: Replace the entire file with the patch content
                      - append: Add the patch content to the end of the file
                      - prepend: Add the patch content to the beginning of the file
                      - smart: Try to intelligently apply changes based on markers
                      - functions: Update or add JavaScript functions
  --git-commit        Automatically commit changes to Git after applying the patch
  --commit-msg        Custom commit message (default: "Applied patch: {patch_file}")
  --git-init          Initialize a Git repository if one doesn't exist

Examples:
  python apply_patch.py changes.txt main.js --git-commit
  python apply_patch.py new_function.txt app.js --backup --mode=append --git-commit --commit-msg="Added new function for API integration"
"""

import os
import sys
import shutil
import argparse
import re
import subprocess
from datetime import datetime

def create_backup(file_path):
    """Create a backup of the original file."""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    backup_path = f"{file_path}.{timestamp}.backup"
    shutil.copy2(file_path, backup_path)
    print(f"Created backup at: {backup_path}")
    return backup_path

def read_file(file_path):
    """Read the content of a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        sys.exit(1)

def write_file(file_path, content):
    """Write content to a file."""
    try:
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Successfully updated: {file_path}")
    except Exception as e:
        print(f"Error writing to file {file_path}: {e}")
        sys.exit(1)

def apply_patch_replace(target_content, patch_content):
    """Replace the entire content of the target file with the patch content."""
    return patch_content

def apply_patch_append(target_content, patch_content):
    """Append the patch content to the end of the target file."""
    return target_content.rstrip() + "\n\n" + patch_content

def apply_patch_prepend(target_content, patch_content):
    """Prepend the patch content to the beginning of the target file."""
    return patch_content + "\n\n" + target_content.lstrip()

def apply_patch_smart(target_content, patch_content):
    """
    Apply changes intelligently based on markers in the patch file.
    
    Supported markers:
    - REPLACE_SECTION: Replace a section of the target file with new content
    - ADD_AFTER: Add content after a specific line or pattern
    - ADD_BEFORE: Add content before a specific line or pattern
    - INSERT_AT: Insert at a specific line number
    """
    result = target_content
    
    # Look for REPLACE_SECTION markers
    replace_matches = re.finditer(
        r"// REPLACE_SECTION\s*\n(.*?)\n// WITH\s*\n(.*?)\n// END_REPLACE",
        patch_content, re.DOTALL
    )
    
    for match in replace_matches:
        original_block = match.group(1).strip()
        replacement_block = match.group(2).strip()
        result = result.replace(original_block, replacement_block)
    
    # Look for ADD_AFTER markers
    after_matches = re.finditer(
        r"// ADD_AFTER\s*\n(.*?)\n// NEW_CONTENT\s*\n(.*?)\n// END_ADD",
        patch_content, re.DOTALL
    )
    
    for match in after_matches:
        target_line = match.group(1).strip()
        new_content = match.group(2).strip()
        result = result.replace(target_line, f"{target_line}\n{new_content}")
    
    # Look for ADD_BEFORE markers
    before_matches = re.finditer(
        r"// ADD_BEFORE\s*\n(.*?)\n// NEW_CONTENT\s*\n(.*?)\n// END_ADD",
        patch_content, re.DOTALL
    )
    
    for match in before_matches:
        target_line = match.group(1).strip()
        new_content = match.group(2).strip()
        result = result.replace(target_line, f"{new_content}\n{target_line}")
    
    # Look for INSERT_AT markers (line number based)
    insert_matches = re.finditer(
        r"// INSERT_AT_LINE (\d+)\s*\n(.*?)\n// END_INSERT",
        patch_content, re.DOTALL
    )
    
    for match in insert_matches:
        line_number = int(match.group(1))
        new_content = match.group(2).strip()
        
        lines = result.split("\n")
        if 1 <= line_number <= len(lines) + 1:
            lines.insert(line_number - 1, new_content)
            result = "\n".join(lines)
    
    return result

def parse_function_blocks(patch_content):
    """Extract function blocks from the patch content."""
    function_pattern = r"function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{(.*?)}"
    functions = {}
    
    for match in re.finditer(function_pattern, patch_content, re.DOTALL):
        func_name = match.group(1)
        func_body = match.group(0)
        functions[func_name] = func_body
        
    return functions

def apply_function_updates(target_content, patch_functions):
    """Update or add functions from the patch to the target file."""
    result = target_content
    
    for func_name, func_body in patch_functions.items():
        # Check if function exists in target
        func_pattern = r"function\s+" + re.escape(func_name) + r"\s*\([^)]*\)\s*{.*?}"
        func_match = re.search(func_pattern, target_content, re.DOTALL)
        
        if func_match:
            # Replace existing function
            result = result.replace(func_match.group(0), func_body)
        else:
            # Add new function at the end
            result += "\n\n" + func_body
            
    return result

def check_git_installed():
    """Check if Git is installed on the system."""
    try:
        subprocess.run(['git', '--version'], capture_output=True, check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False

def is_git_repository():
    """Check if the current directory is a Git repository."""
    try:
        subprocess.run(['git', 'rev-parse', '--is-inside-work-tree'], 
                      capture_output=True, check=True)
        return True
    except subprocess.SubprocessError:
        return False

def initialize_git_repository():
    """Initialize a new Git repository."""
    try:
        subprocess.run(['git', 'init'], check=True)
        print("Git repository initialized successfully.")
        return True
    except subprocess.SubprocessError as e:
        print(f"Error initializing Git repository: {e}")
        return False

def git_commit_changes(file_path, commit_message):
    """Commit changes to Git."""
    try:
        # Add the file to the staging area
        subprocess.run(['git', 'add', file_path], check=True)
        
        # Commit the changes
        subprocess.run(['git', 'commit', '-m', commit_message], check=True)
        
        print(f"Changes committed to Git with message: '{commit_message}'")
        return True
    except subprocess.SubprocessError as e:
        print(f"Error committing changes to Git: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Apply patches to source files with Git integration")
    parser.add_argument("patch_file", help="File containing the patch")
    parser.add_argument("target_file", help="File to apply the patch to")
    parser.add_argument("--backup", action="store_true", help="Create a backup before applying the patch")
    parser.add_argument("--mode", choices=["replace", "append", "prepend", "smart", "functions"], 
                        default="replace", help="Patch application mode")
    parser.add_argument("--git-commit", action="store_true", help="Commit changes to Git after applying the patch")
    parser.add_argument("--commit-msg", help="Custom commit message")
    parser.add_argument("--git-init", action="store_true", help="Initialize a Git repository if one doesn't exist")
    
    args = parser.parse_args()
    
    # Check if files exist
    if not os.path.isfile(args.patch_file):
        print(f"Error: Patch file '{args.patch_file}' not found.")
        sys.exit(1)
        
    if not os.path.isfile(args.target_file):
        print(f"Error: Target file '{args.target_file}' not found.")
        sys.exit(1)
    
    # Check Git setup if needed
    if args.git_commit or args.git_init:
        if not check_git_installed():
            print("Error: Git is not installed or not available in PATH. Cannot commit changes.")
            sys.exit(1)
        
        # Initialize Git repository if requested
        if args.git_init and not is_git_repository():
            if not initialize_git_repository():
                print("Warning: Could not initialize Git repository. Will continue without Git integration.")
                args.git_commit = False
        
        # Check if in a Git repository
        if args.git_commit and not is_git_repository():
            print("Error: Not in a Git repository. Use --git-init to create one, or navigate to a repository.")
            sys.exit(1)
    
    # Read the files
    patch_content = read_file(args.patch_file)
    target_content = read_file(args.target_file)
    
    # Create backup if requested
    if args.backup:
        create_backup(args.target_file)
    
    # Apply the patch based on the selected mode
    if args.mode == "replace":
        new_content = apply_patch_replace(target_content, patch_content)
    elif args.mode == "append":
        new_content = apply_patch_append(target_content, patch_content)
    elif args.mode == "prepend":
        new_content = apply_patch_prepend(target_content, patch_content)
    elif args.mode == "smart":
        new_content = apply_patch_smart(target_content, patch_content)
    elif args.mode == "functions":
        patch_functions = parse_function_blocks(patch_content)
        new_content = apply_function_updates(target_content, patch_functions)
    
    # Check if there are actual changes
    if new_content == target_content:
        print("No changes were made. The target file is already up-to-date.")
        sys.exit(0)
    
    # Write the updated content
    write_file(args.target_file, new_content)
    
    # Commit changes to Git if requested
    if args.git_commit:
        commit_message = args.commit_msg if args.commit_msg else f"Applied patch: {os.path.basename(args.patch_file)}"
        
        if not git_commit_changes(args.target_file, commit_message):
            print("Warning: Changes were applied but could not be committed to Git.")
    
    print("Patch applied successfully.")

if __name__ == "__main__":
    main()