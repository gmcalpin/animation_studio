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
  --ignore-whitespace Allow patches to match ignoring whitespace differences
  --safe-mode         Restore file to original state if patch application fails

Examples:
  python apply_patch.py changes.txt main.js --git-commit
  python apply_patch.py new_function.txt app.js --backup --mode=append --git-commit --commit-msg="Added new function for API integration"
  python apply_patch.py smart_changes.txt code.js --mode=smart --ignore-whitespace
"""

import os
import sys
import shutil
import argparse
import re
import subprocess
import difflib
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

def normalize_whitespace(text):
    """Normalize whitespace for comparison by removing leading/trailing spaces and collapsing multiple spaces."""
    # Replace tabs with spaces
    text = text.replace('\t', '    ')
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    # Split into lines, strip each line, and rejoin
    lines = [line.strip() for line in text.split('\n')]
    return '\n'.join(lines)

def find_section_smart(content, section, ignore_whitespace=False):
    """Find the section in content, optionally ignoring whitespace differences."""
    if not ignore_whitespace:
        # Regular exact matching
        start = content.find(section)
        if start != -1:
            return start, start + len(section)
        return None, None
    
    # Whitespace-insensitive matching
    normalized_section = normalize_whitespace(section)
    lines = content.split('\n')
    section_lines = section.split('\n')
    
    if len(section_lines) > len(lines):
        return None, None
    
    # Try to match each possible starting position
    for i in range(len(lines) - len(section_lines) + 1):
        potential_match = '\n'.join(lines[i:i+len(section_lines)])
        if normalize_whitespace(potential_match) == normalized_section:
            # Calculate the actual character offsets
            start_offset = sum(len(lines[j]) + 1 for j in range(i))
            end_offset = start_offset + len(potential_match)
            return start_offset, end_offset
    
    # If we get here, use fuzzy matching as a last resort
    best_ratio = 0
    best_match = None
    
    for i in range(len(lines) - len(section_lines) + 1):
        potential_match = '\n'.join(lines[i:i+len(section_lines)])
        ratio = difflib.SequenceMatcher(None, 
                                      normalize_whitespace(potential_match), 
                                      normalized_section).ratio()
        if ratio > best_ratio and ratio > 0.8:  # 80% similarity threshold
            best_ratio = ratio
            best_match = (i, i+len(section_lines))
    
    if best_match:
        start_offset = sum(len(lines[j]) + 1 for j in range(best_match[0]))
        end_offset = sum(len(lines[j]) + 1 for j in range(best_match[1]))
        return start_offset, end_offset
    
    return None, None

def apply_patch_smart(target_content, patch_content, ignore_whitespace=False):
    """
    Apply changes intelligently based on markers in the patch file.
    With improved whitespace handling.
    """
    result = target_content
    changes_made = False
    
    # Handle REPLACE_SECTION markers
    replace_pattern = r"// REPLACE_SECTION\s*\n(.*?)\n// WITH\s*\n(.*?)\n// END_REPLACE"
    replace_matches = re.finditer(replace_pattern, patch_content, re.DOTALL)
    
    for match in replace_matches:
        original_block = match.group(1).strip()
        replacement_block = match.group(2).strip()
        
        # Find the section to replace with smarter whitespace handling
        start, end = find_section_smart(result, original_block, ignore_whitespace)
        
        if start is not None and end is not None:
            prefix = result[:start]
            suffix = result[end:]
            result = prefix + replacement_block + suffix
            changes_made = True
            print(f"Replaced section:\n{original_block[:100]}...\nWith:\n{replacement_block[:100]}...")
        else:
            print(f"WARNING: Could not find section to replace:\n{original_block[:100]}...")
    
    # Handle ADD_AFTER markers
    after_pattern = r"// ADD_AFTER\s*\n(.*?)\n// NEW_CONTENT\s*\n(.*?)\n// END_ADD"
    after_matches = re.finditer(after_pattern, patch_content, re.DOTALL)
    
    for match in after_matches:
        target_line = match.group(1).strip()
        new_content = match.group(2).strip()
        
        # Find the target line with smarter whitespace handling
        start, end = find_section_smart(result, target_line, ignore_whitespace)
        
        if start is not None and end is not None:
            before = result[:end]
            after = result[end:]
            result = before + "\n" + new_content + after
            changes_made = True
            print(f"Added content after:\n{target_line[:100]}...")
        else:
            print(f"WARNING: Could not find target to add after:\n{target_line[:100]}...")
    
    # Handle ADD_BEFORE markers
    before_pattern = r"// ADD_BEFORE\s*\n(.*?)\n// NEW_CONTENT\s*\n(.*?)\n// END_ADD"
    before_matches = re.finditer(before_pattern, patch_content, re.DOTALL)
    
    for match in before_matches:
        target_line = match.group(1).strip()
        new_content = match.group(2).strip()
        
        # Find the target line with smarter whitespace handling
        start, end = find_section_smart(result, target_line, ignore_whitespace)
        
        if start is not None and end is not None:
            before = result[:start]
            after = result[start:]
            result = before + new_content + "\n" + after
            changes_made = True
            print(f"Added content before:\n{target_line[:100]}...")
        else:
            print(f"WARNING: Could not find target to add before:\n{target_line[:100]}...")
    
    # Handle INSERT_AT_LINE markers
    insert_pattern = r"// INSERT_AT_LINE (\d+)\s*\n(.*?)\n// END_INSERT"
    insert_matches = re.finditer(insert_pattern, patch_content, re.DOTALL)
    
    for match in insert_matches:
        line_number = int(match.group(1))
        new_content = match.group(2).strip()
        
        lines = result.split("\n")
        if 1 <= line_number <= len(lines) + 1:
            lines.insert(line_number - 1, new_content)
            result = "\n".join(lines)
            changes_made = True
            print(f"Inserted at line {line_number}")
        else:
            print(f"WARNING: Line number {line_number} is out of range (1-{len(lines) + 1})")
    
    return result, changes_made

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
    changes_made = False
    
    for func_name, func_body in patch_functions.items():
        # Check if function exists in target
        func_pattern = r"function\s+" + re.escape(func_name) + r"\s*\([^)]*\)\s*{.*?}"
        func_match = re.search(func_pattern, target_content, re.DOTALL)
        
        if func_match:
            # Replace existing function
            old_func = func_match.group(0)
            result = result.replace(old_func, func_body)
            changes_made = True
            print(f"Updated function: {func_name}")
        else:
            # Add new function at the end
            result += "\n\n" + func_body
            changes_made = True
            print(f"Added new function: {func_name}")
            
    return result, changes_made

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
    parser.add_argument("--ignore-whitespace", action="store_true", help="Ignore whitespace differences when applying patches")
    parser.add_argument("--safe-mode", action="store_true", help="Restore file to original state if patch application fails")
    
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
    backup_path = None
    if args.backup or args.safe_mode:
        backup_path = create_backup(args.target_file)
    
    try:
        # Apply the patch based on the selected mode
        changes_made = False
        if args.mode == "replace":
            new_content = apply_patch_replace(target_content, patch_content)
            changes_made = new_content != target_content
        elif args.mode == "append":
            new_content = apply_patch_append(target_content, patch_content)
            changes_made = True
        elif args.mode == "prepend":
            new_content = apply_patch_prepend(target_content, patch_content)
            changes_made = True
        elif args.mode == "smart":
            new_content, changes_made = apply_patch_smart(target_content, patch_content, args.ignore_whitespace)
        elif args.mode == "functions":
            patch_functions = parse_function_blocks(patch_content)
            new_content, changes_made = apply_function_updates(target_content, patch_functions)
        
        # Check if there are actual changes
        if not changes_made:
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
    except Exception as e:
        print(f"Error applying patch: {e}")
        
        # Restore from backup if safe mode is enabled
        if args.safe_mode and backup_path:
            print("Restoring original file from backup...")
            shutil.copy2(backup_path, args.target_file)
            print(f"Original file restored. No changes were made to {args.target_file}")
        
        sys.exit(1)

if __name__ == "__main__":
    main()