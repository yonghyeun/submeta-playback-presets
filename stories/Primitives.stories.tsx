import {useState} from 'react';
import {Button, Checkbox, SelectField, StatusMessage} from '../ui/components';
import {Frame, specimenCSS} from './Frame';
export default {id:'primitives', title:'기본 요소/모아보기', parameters:{controls:{disable:true}}};
function ControlsDemo() {
  const [checked,setChecked] = useState(true);
  const [rate,setRate] = useState('1.25');
  return <Frame className="primitive-scene" css={specimenCSS}><main><h1>기본 요소</h1><h2>행동의 중요도</h2><div className="row"><Button variant="primary">주요 행동</Button><Button>보조 행동</Button><Button disabled>사용 불가</Button></div><h2>입력과 상태</h2><div className="row"><Checkbox label="설정 유지" checked={checked} onChange={setChecked}/><SelectField label="배속" value={rate} options={[{value:'1.25',label:'1.25×'},{value:'1.5',label:'1.5×'}]} onChange={setRate}/></div><p><StatusMessage tone="success">저장됨 · 이 브라우저에 유지</StatusMessage></p><p><StatusMessage tone="error">저장 실패 · 다시 변경해 주세요</StatusMessage></p></main></Frame>;
}
export const Controls = {name:'버튼 · 입력 · 상태',render:() => <ControlsDemo/>};
