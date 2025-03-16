#!/usr/bin/env python3
"""
apply_patch.py - A tool to apply patch files to source code

This script applies patch files to source code files using various patch modes.
It supports replacing, appending, prepending, or "smart" patching (which tries
to intelligently determine where to add code).

Usage:
  python apply_patch.py --file=<file_path> --patch=<patch_path> [--mode=<mode>] [options]

Options:
  --file              The file to patch
  --patch             The patch file to apply
  --mode              Patch mode (replace, append, prepend, smart, functions) [default: replace]
  --ignore-whitespace Ignore whitespace differences when matching sections
  --git-commit        Commit changes to git after successful patch
  --git-push          Push changes to git after successful commit
  --safe-mode         Create a backup and restore on failure
"""

import argparse
import os
import re
import subprocess
import shutil
import sys

def read_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filename, content):
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

def parse_args():
    parser = argparse.ArgumentParser(description='Apply patches to source code files')
    parser.add_argument('--file', required=True, help='File to apply the patch to')
    parser.add_argument('--patch', required=True, help='Patch file to apply')
    parser.add_argument('--mode', default='replace', 
                        choices=['replace', 'append', 'prepend', 'smart', 'functions'],
                        help='Mode to apply the patch')
    parser.add_argument('--ignore-whitespace', action='store_true',
                        help='Ignore whitespace differences when matching sections')
    parser.add_argument('--git-commit', action='store_true',
                        help='Commit changes to git after successful patch')
    parser.add_argument('--git-push', action='store_true',
                        help='Push changes to git after successful commit')
    parser.add_argument('--safe-mode', action='store_true',
                        help='Create a backup and restore on failure')
    return parser.parse_args()

def backup_file(file_path):
    backup_path = f"{file_path}.bak"
    shutil.copy2(file_path, backup_path)
    return backup_path

def restore_from_backup(file_path, backup_path):
    shutil.copy2(backup_path, file_path)
    os.remove(backup_path)
    print(f"Restored {file_path} from backup")

def parse_replace_patch(patch_content):
    sections = re.split(r'// REPLACE_SECTION\n', patch_content)[1:]
    replacements = []
    
    for section in sections:
        parts = re.split(r'// WITH\n', section, maxsplit=1)
        if len(parts) != 2:
            print("Error: Invalid replacement section in patch file")
            sys.exit(1)
            
        old_code, rest = parts
        new_code = rest.split('// END_REPLACE', 1)[0]
        replacements.append((old_code, new_code))
        
    return replacements

def parse_append_patch(patch_content):
    sections = re.split(r'// APPEND\n', patch_content)[1:]
    append_sections = []
    
    for section in sections:
        code = section.split('// END_APPEND', 1)[0]
        append_sections.append(code)
        
    return append_sections

def parse_prepend_patch(patch_content):
    sections = re.split(r'// PREPEND\n', patch_content)[1:]
    prepend_sections = []
    
    for section in sections:
        code = section.split('// END_PREPEND', 1)[0]
        prepend_sections.append(code)
        
    return prepend_sections

def parse_smart_patch(patch_content):
    sections = re.split(r'// ADD_AFTER\n', patch_content)[1:]
    additions = []
    
    for section in sections:
        parts = re.split(r'// NEW_CONTENT\n', section, maxsplit=1)
        if len(parts) != 2:
            print("Error: Invalid smart addition section in patch file")
            sys.exit(1)
            
        target_code, rest = parts
        new_code = rest.split('// END_ADD', 1)[0]
        additions.append((target_code, new_code))
        
    return additions

def parse_functions_patch(patch_content):
    sections = re.split(r'// FUNCTION\n', patch_content)[1:]
    functions = []
    
    for section in sections:
        parts = re.split(r'// CODE\n', section, maxsplit=1)
        if len(parts) != 2:
            print("Error: Invalid function section in patch file")
            sys.exit(1)
            
        signature, rest = parts
        code = rest.split('// END_FUNCTION', 1)[0]
        functions.append((signature.strip(), code))
        
    return functions

def apply_replace_patch(file_content, replacements, ignore_whitespace=False):
    changed = False
    patched_content = file_content
    
    for old_code, new_code in replacements:
        if ignore_whitespace:
            # Normalize whitespace for matching
            pattern = re.escape(old_code.strip()).replace('\\n\\s*', '\\s*\\n\\s*')
            matches = re.search(pattern, patched_content, re.DOTALL)
            if not matches:
                print(f"Warning: Could not find section to replace:\n{old_code}")
                continue
            match_text = matches.group(0)
            patched_content = patched_content.replace(match_text, new_code, 1)
            changed = True
        else:
            if old_code not in patched_content:
                print(f"Warning: Could not find section to replace:\n{old_code}")
                continue
            patched_content = patched_content.replace(old_code, new_code, 1)
            changed = True
    
    if not changed:
        print("Error: No changes were applied")
        return file_content, False
    
    return patched_content, True

def apply_append_patch(file_content, append_sections):
    if not append_sections:
        print("Error: No append sections found")
        return file_content, False
    
    patched_content = file_content
    for code in append_sections:
        patched_content += "\n" + code
    
    return patched_content, True

def apply_prepend_patch(file_content, prepend_sections):
    if not prepend_sections:
        print("Error: No prepend sections found")
        return file_content, False
    
    patched_content = file_content
    for code in reversed(prepend_sections):
        patched_content = code + "\n" + patched_content
    
    return patched_content, True

def apply_smart_patch(file_content, additions, ignore_whitespace=False):
    changed = False
    patched_content = file_content
    
    for target_code, new_code in additions:
        if ignore_whitespace:
            # Normalize whitespace for matching
            pattern = re.escape(target_code.strip()).replace('\\n\\s*', '\\s*\\n\\s*')
            matches = re.search(pattern, patched_content, re.DOTALL)
            if not matches:
                print(f"Warning: Could not find target for smart addition:\n{target_code}")
                continue
            match_text = matches.group(0)
            insert_pos = patched_content.find(match_text) + len(match_text)
            patched_content = patched_content[:insert_pos] + "\n" + new_code + patched_content[insert_pos:]
            changed = True
        else:
            if target_code not in patched_content:
                print(f"Warning: Could not find target for smart addition:\n{target_code}")
                continue
            insert_pos = patched_content.find(target_code) + len(target_code)
            patched_content = patched_content[:insert_pos] + "\n" + new_code + patched_content[insert_pos:]
            changed = True
    
    if not changed:
        print("Error: No changes were applied")
        return file_content, False
    
    return patched_content, True

def apply_functions_patch(file_content, functions):
    if not functions:
        print("Error: No function sections found")
        return file_content, False
    
    changed = False
    patched_content = file_content
    
    for signature, code in functions:
        # Check if function with this signature already exists
        pattern = re.escape(signature) + r'\s*\{.*?\}'
        if re.search(pattern, patched_content, re.DOTALL):
            # Replace existing function
            patched_content = re.sub(pattern, signature + " {\n" + code + "\n}", patched_content, flags=re.DOTALL)
            changed = True
        else:
            # Add new function at the end of the file
            patched_content += "\n\n" + signature + " {\n" + code + "\n}"
            changed = True
    
    if not changed:
        print("Error: No changes were applied")
        return file_content, False
    
    return patched_content, True

def git_commit(file_path, message=None):
    if not message:
        message = f"Applied patch to {os.path.basename(file_path)}"
    
    try:
        subprocess.run(['git', 'add', file_path], check=True)
        subprocess.run(['git', 'commit', '-m', message], check=True)
        print(f"Changes committed to git")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error committing changes to git: {e}")
        return False

def git_push():
    try:
        subprocess.run(['git', 'push'], check=True)
        print("Changes pushed to git")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error pushing changes to git: {e}")
        return False

def main():
    args = parse_args()
    
    # Check if files exist
    if not os.path.exists(args.file):
        print(f"Error: File {args.file} not found")
        sys.exit(1)
        
    if not os.path.exists(args.patch):
        print(f"Error: Patch file {args.patch} not found")
        sys.exit(1)
    
    # Read file and patch content
    file_content = read_file(args.file)
    patch_content = read_file(args.patch)
    
    # Create backup if specified
    backup_path = None
    if args.safe_mode:
        backup_path = backup_file(args.file)
        print(f"Created backup at {backup_path}")
    
    try:
        # Parse and apply patch based on mode
        if args.mode == 'replace':
            replacements = parse_replace_patch(patch_content)
            patched_content, changed = apply_replace_patch(file_content, replacements, args.ignore_whitespace)
        elif args.mode == 'append':
            append_sections = parse_append_patch(patch_content)
            patched_content, changed = apply_append_patch(file_content, append_sections)
        elif args.mode == 'prepend':
            prepend_sections = parse_prepend_patch(patch_content)
            patched_content, changed = apply_prepend_patch(file_content, prepend_sections)
        elif args.mode == 'smart':
            additions = parse_smart_patch(patch_content)
            patched_content, changed = apply_smart_patch(file_content, additions, args.ignore_whitespace)
        elif args.mode == 'functions':
            functions = parse_functions_patch(patch_content)
            patched_content, changed = apply_functions_patch(file_content, functions)
        
        # Check if changes were made
        if not changed:
            if args.safe_mode and backup_path:
                os.remove(backup_path)
            sys.exit(1)
        
        # Write patched content to file
        write_file(args.file, patched_content)
        print(f"Successfully applied {args.mode} patch to {args.file}")
        
        # Handle git operations
        if args.git_commit:
            success = git_commit(args.file)
            if success and args.git_push:
                git_push()
        
        # Clean up backup if everything succeeded
        if args.safe_mode and backup_path:
            os.remove(backup_path)
    
    except Exception as e:
        print(f"Error applying patch: {e}")
        
        # Restore from backup if we have one
        if args.safe_mode and backup_path:
            restore_from_backup(args.file, backup_path)
        
        sys.exit(1)

if __name__ == '__main__':
    main()