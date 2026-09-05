import json
import os

path = r'C:\Users\Usuario\.gemini\antigravity-ide\brain\644e785f-0308-4c1f-a56b-793ba0c20d49\.system_generated\logs\transcript_full.jsonl'
if not os.path.exists(path):
    print('Not found')
else:
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if 'dedicatoria' in line.lower() or 'coraje' in line.lower() or 'iphone' in line.lower() or 'legacy_html' in line.lower():
                try:
                    data = json.loads(line)
                    type_str = data.get('type')
                    step_index = data.get('step_index')
                    print(f'Line found! Step: {step_index}, Type: {type_str}')
                    
                    if type_str == 'USER_INPUT' or type_str == 'PLANNER_RESPONSE':
                        content = data.get('content', '')
                        if 'dedicatoria' in content.lower():
                            print(content[:500])
                    elif type_str == 'TOOL_CALL_RESULT':
                        output = data.get('output', '')
                        if 'dedicatoria' in output.lower():
                            idx = output.lower().find('dedicatoria')
                            print(output[max(0, idx-100):min(len(output), idx+500)])
                except Exception as e:
                    pass
