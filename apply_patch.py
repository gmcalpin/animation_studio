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
import shutil
import subprocess
import sys
import tempfile


def read_file(file_path):
    """Read a file and return its contents."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        sys.exit(1)


def write_file(file_path, content):
    """Write content to a file."""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        print(f"Error writing to file {file_path}: {e}")
        sys.exit(1)


def backup_file(file_path):
    """Create a backup of the file."""
    backup_path = f"{file_path}.bak"
    try:
        shutil.copy2(file_path, backup_path)
        return backup_path
    except Exception as e:
        print(f"Error creating backup of {file_path}: {e}")
        sys.exit(1)


def restore_backup(backup_path, file_path):
    """Restore the file from backup."""
    try:
        shutil.copy2(backup_path, file_path)
        os.remove(backup_path)
        print(f"Restored {file_path} from backup.")
    except Exception as e:
        print(f"Error restoring {file_path} from backup: {e}")


def git_commit(file_path, message=None):
    """Commit changes to git."""
    try:
        if not message:
            message = f"Applied patch to {os.path.basename(file_path)}"
        
        subprocess.run(['git', 'add', file_path], check=True)
        subprocess.run(['git', 'commit', '-m', message], check=True)
        print(f"Changes to {file_path} committed to git.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error committing changes to git: {e}")
        return False


def git_push():
    """Push changes to git remote."""
    try:
        subprocess.run(['git', 'push'], check=True)
        print("Changes pushed to git remote.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error pushing changes to git: {e}")
        return False


def parse_patch_file(patch_content, mode):
    """Parse the patch file based on the specified mode."""
    if mode == "replace":
        # Format: // REPLACE_SECTION\n<old_code>\n// WITH\n<new_code>\n// END_REPLACE
        sections = re.split(r'// REPLACE_SECTION\n', patch_content)[1:]
        replacements = []
        
        for section in sections:
            parts = re.split(r'// WITH\n', section, maxsplit=1)
            if len(parts) != 2:
                print("Error: Invalid replacement section in patch file.")
                sys.exit(1)
                
            old_code, rest = parts
            new_code = rest.split('// END_REPLACE', 1)[0]
            replacements.append((old_code, new_code))
            
        return replacements
    
    elif mode == "append":
        # Format: // APPEND\n<code_to_append>\n// END_APPEND
        append_sections = re.findall(r'// APPEND\n(.*?)// END_APPEND', patch_content, re.DOTALL)
        return append_sections
    
    elif mode == "prepend":
        # Format: // PREPEND\n<code_to_prepend>\n// END_PREPEND
        prepend_sections = re.findall(r'// PREPEND\n(.*?)// END_PREPEND', patch_content, re.DOTALL)
        return prepend_sections
    
    elif mode == "smart":
        # Format: // ADD_AFTER\n<target_code>\n// NEW_CONTENT\n<new_code>\n// END_ADD
        sections = re.split(r'// ADD_AFTER\n', patch_content)[1:]
        additions = []
        
        for section in sections:
            parts = re.split(r'// NEW_CONTENT\n', section, 1)
            if len(parts) != 2:
                print("Error: Invalid smart addition section in patch file.")
                sys.exit(1)
                
            target_code, rest = parts
            new_code = rest.split('// END_ADD', 1)[0]
            additions.append((target_code, new_code))
            
        return additions
    
    elif mode == "functions":
        # Format: // FUNCTION\n<function_signature>\n// CODE\n<function_code>\n// END_FUNCTION
        sections = re.split(r'// FUNCTION\n', patch_content)[1:]
        functions = []
        
        for section in sections:
            parts = re.split(r'// CODE\n', section, 1)
            if len(parts) != 2:
                print("Error: Invalid function section in patch file.")
                sys.exit(1)
                
            signature, rest = parts
            code = rest.split('// END_FUNCTION', 1)[0]
            functions.append((signature.strip(), code))
            
        return functions
    
    else:
        print(f"Error: Unsupported patch mode '{mode}'.")
        sys.exit(1)


def apply_replace_patch(file_content, replacements, ignore_whitespace=False):
    """Apply replacement patches to the file content."""
    patched_content = file_content
    
    for old_code, new_code in replacements:
        if ignore_whitespace:
            # Normalize whitespace for matching
            pattern = re.escape(old_code.strip()).replace('\\n\\s*', '\\s*\\n\\s*')
            if not re.search(pattern, patched_content, re.DOTALL):
                print(f"Warning: Could not find section to replace:\n{old_code}")
                continue
            
            patched_content = re.sub(pattern, new_code, patched_content, count=1, flags=re.DOTALL)
        else:
            if old_code not in patched_content:
                print(f"Warning: Could not find section to replace:\n{old_code}")
                continue
            
            patched_content = patched_content.replace(old_code, new_code, 1)
    
    return patched_content


def apply_append_patch(file_content, append_sections):
    """Apply append patches to the file content."""
    patched_content = file_content
    
    for code_to_append in append_sections:
        patched_content += "\n" + code_to_append
    
    return patched_content


def apply_prepend_patch(file_content, prepend_sections):
    """Apply prepend patches to the file content."""
    patched_content = file_content
    
    for code_to_prepend in reversed(prepend_sections):
        patched_content = code_to_prepend + "\n" + patched_content
    
    return patched_content


def apply_smart_patch(file_content, additions, ignore_whitespace=False):
    """Apply smart patches to the file content."""
    patched_content = file_content
    
    for target_code, new_code in additions:
        if ignore_whitespace:
            # Normalize whitespace for matching
            pattern = re.escape(target_code.strip()).replace('\\n\\s*', '\\s*\\n\\s*')
            match = re.search(pattern, patched_content, re.DOTALL)
            if not match:
                print(f"Warning: Could not find target for smart addition:\n{target_code}")
                continue
            
            end_pos = match.end()
            patched_content = patched_content[:end_pos] + "\n" + new_code + patched_content[end_pos:]
        else:
            if target_code not in patched_content:
                print(f"Warning: Could not find target for smart addition:\n{target_code}")
                continue
            
            insert_pos = patched_content.find(target_code) + len(target_code)
            patched_content = patched_content[:insert_pos] + "\n" + new_code + patched_content[insert_pos:]
    
    return patched_content


def apply_function_patches(file_content, functions):
    """Apply function patches to the file content."""
    patched_content = file_content
    
    for signature, code in functions:
        # Check if function with this signature already exists
        pattern = re.escape(signature) + r'\s*\{.*?\}'
        if re.search(pattern, patched_content, re.DOTALL):
            # Replace existing function
            patched_content = re.sub(pattern, signature + " {\n" + code + "\n}", patched_content, flags=re.DOTALL)
        else:
            # Add new function at the end of the file
            patched_content += "\n\n" + signature + " {\n" + code + "\n}"
    
    return patched_content


def apply_patch(file_path, patch_path, mode="replace", ignore_whitespace=False,
                git_commit_changes=False, git_push_changes=False, safe_mode=False):
    """Apply a patch file to a source code file."""
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        sys.exit(1)
    
    if not os.path.exists(patch_path):
        print(f"Error: Patch file {patch_path} not found.")
        sys.exit(1)
    
    file_content = read_file(file_path)
    patch_content = read_file(patch_path)
    
    # Create a backup if requested
    backup_path = None
    if safe_mode:
        backup_path = backup_file(file_path)
        print(f"Created backup at {backup_path}")
    
    try:
        # Parse the patch file
        parsed_patch = parse_patch_file(patch_content, mode)
        
        # Apply the patch
        if mode == "replace":
            patched_content = apply_replace_patch(file_content, parsed_patch, ignore_whitespace)
        elif mode == "append":
            patched_content = apply_append_patch(file_content, parsed_patch)
        elif mode == "prepend":
            patched_content = apply_prepend_patch(file_content, parsed_patch)
        elif mode == "smart":
            patched_content = apply_smart_patch(file_content, parsed_patch, ignore_whitespace)
        elif mode == "functions":
            patched_content = apply_function_patches(file_content, parsed_patch)
        
        # Write the patched content back to the file
        write_file(file_path, patched_content)
        print(f"Successfully applied {mode} patch to {file_path}")
        
        # Commit changes to git if requested
        if git_commit_changes:
            success = git_commit(file_path)
            
            # Push changes to git if requested and commit was successful
            if success and git_push_changes:
                git_push()
        
        # Clean up backup if not needed
        if safe_mode:
            os.remove(backup_path)
        
        return True
    
    except Exception as e:
        print(f"Error applying patch: {e}")
        
        # Restore from backup if available
        if safe_mode and backup_path:
            restore_backup(backup_path, file_path)
        
        return False


def main():
    parser = argparse.ArgumentParser(description="Apply patch files to source code")
    parser.add_argument("--file", required=True, help="File to patch")
    parser.add_argument("--patch", required=True, help="Patch file to apply")
    parser.add_argument("--mode", default="replace", 
                        choices=["replace", "append", "prepend", "smart", "functions"],
                        help="Patch mode (default: replace)")
    parser.add_argument("--ignore-whitespace", action="store_true",
                        help="Ignore whitespace differences when matching sections")
    parser.add_argument("--git-commit", action="store_true",
                        help="Commit changes to git after successful patch")
    parser.add_argument("--git-push", action="store_true",
                        help="Push changes to git after successful commit")
    parser.add_argument("--safe-mode", action="store_true",
                        help="Create a backup and restore on failure")
    
    args = parser.parse_args()
    
    success = apply_patch(
        args.file,
        args.patch,
        args.mode,
        args.ignore_whitespace,
        args.git_commit,
        args.git_push,
        args.safe_mode
    )
    
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()